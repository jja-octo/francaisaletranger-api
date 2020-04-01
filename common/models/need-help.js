/* eslint-disable max-len */
'use strict';
var loopback = require('loopback');

module.exports = function(Needhelp) {
  Needhelp.observe('after save', function(ctx, next) {
    Needhelp.updatePostGISGpsCoordinates(ctx.instance.id, function(err) {
      if (err) return next(err);
      next();
    });
  });

  Needhelp.updatePostGISGpsCoordinates = function(id, cb) {
    const sqlStatement = 'update needhelp set gps_coordinates_geo=ST_POINT(gps_coordinates[0],gps_coordinates[1]) where id=$1';
    const sqlParams = [id];
    Needhelp.dataSource.connector.execute(sqlStatement, sqlParams, function(err) {
      cb(err);
    });
  };

  Needhelp.matching = function(id, maxDistance, cb) {
    let savedNeeder;

    Needhelp.findOne({
      where: {
        id,
      },
    }, (err, needer) => {
      savedNeeder = needer;
      const sqlStatement = 'select id, st_distance(gps_coordinates_geo,st_point($1,$2)) as distanceInMeters from helper where ST_DWithin(gps_coordinates_geo,st_point($1,$2), $3)';
      const sqlParams = [needer.gps_coordinates.lng, needer.gps_coordinates.lat, maxDistance];
      Needhelp.dataSource.connector.query(sqlStatement, sqlParams, (err, neerHelpersPostGIS) => {
        const ids = neerHelpersPostGIS.map(record => record.id);
        Needhelp.app.models.Helper.find({
          where: {
            and: [
              {
                id: {
                  inq: ids,
                },
              },
              {
                need_help_id: null,
              },
              {
                or: [{
                  nombre_hebergement: {
                    gte: needer.nombre_hebergement,
                  },
                }, {
                  approvisionnement: needer.approvisionnement,
                }, {
                  autres: needer.autres,
                }, {
                  conseils: needer.conseils,
                }],
              },
            ],
          },
        }, (err, foundHelperList) => {
          const preparedHelperList = foundHelperList.map((foundHelper) => {
            function criteresMatching(foundHelper) {
              let score = 0;
              let total = 0;

              if (savedNeeder.nombre_hebergement > 0) {
                score += (foundHelper.nombre_hebergement >= savedNeeder.nombre_hebergement) ? 1 : 0;
                total += 1;
              }
              if (savedNeeder.approvisionnement) {
                score += (savedNeeder.approvisionnement === foundHelper.approvisionnement) ? 1 : 0;
                total += 1;
              }
              if (savedNeeder.autres) {
                score += (savedNeeder.autres === foundHelper.autres) ? 1 : 0;
                total += 1;
              }
              if (savedNeeder.conseils) {
                score += (savedNeeder.conseils === foundHelper.conseils) ? 1 : 0;
                total += 1;
              }

              return {score, total};
            }

            return {
              id: foundHelper.id,
              nom: foundHelper.nom,
              prenom: foundHelper.prenom,
              nombre_hebergement: foundHelper.nombre_hebergement,
              approvisionnement: foundHelper.approvisionnement,
              conseils: foundHelper.conseils,
              autres: foundHelper.autres,
              criteresMatching: criteresMatching(foundHelper),
              distanceInMeters: neerHelpersPostGIS.filter(helper => helper.id === foundHelper.id)[0].distanceinmeters,
            };
          });

          preparedHelperList
            .sort((a, b) => {
              // we sort by distance
              return a.distanceInMeters - b.distanceInMeters;
            })
            .map((helper, index) => {
              let addToScore;

              // if the current distance is the same as the previous one, we add the same score
              if (index !== 0 && preparedHelperList[index - 1].distanceInMeters === helper.distanceInMeters) {
                addToScore = 1 - ((index - 1) / preparedHelperList.length);
              } else {
                // otherwise we calculate a pro rata in relation to the total number of aid requests according to the position in the list
                addToScore = 1 - (index / preparedHelperList.length);
              }

              helper.scoring = helper.criteresMatching.score + Math.round(addToScore * 100) / 100;

              return helper;
            });

          cb(err, preparedHelperList.sort((a, b) => {
            return b.scoring - a.scoring;
          }));
        }); // end find
      });
    }); // End method
  };

  Needhelp.allWithMatching = function(maxDistance, cb) {
    Needhelp.find({
      where: {
        helper_id: null,
      },
      limit: process.env.MATCHING_LIMIT || null,
    }, (err, needers) => {
      let requests = needers.map((needers) => {
        return new Promise((resolve) => {
          Needhelp.matching(needers.id, maxDistance, (err, results) => {
            resolve(Object.assign(needers, {
              score: results.length,
            }));
          });
        });
      });

      Promise.all(requests).then((results) => {
        cb(null, results.filter(needHelp => needHelp.score > 0));
      });
    });
  };

  Needhelp.sendMatching = function(needHelp_id, helper_id, cb) {
    Needhelp.findOne({
      where: {
        id: needHelp_id,
      },
    }, (err, needer) => {
      Needhelp.app.models.Helper.findOne({
        where: {
          id: helper_id,
        },
      }, (error, helper) => {
        const maxDistance = 10000;

        loopback.Email.send({
          from: process.env.MAILJET_FROM,
          to: needer.email,
          subject: 'Solidarité Francais à l\'étranger : quelqu\'un peut vous aider !',
          text: `La plateforme Solidarité Francais à l'étranger vient de vous trouver de l\'aide. Vous pouvez contacter ${helper.prenom} ${helper.nom} à cette adresse email: ${helper.email}. Cette personne est à moins de ${maxDistance / 1000} km de vous. Bonne prise de contact :)`,
          html: `<div><p>La plateforme <a href="https://solidarite-fde.beta.gouv.fr">Solidarité Francais à l'étranger</a> vient de vous trouver de l'aide.</p><p>Vous pouvez contacter ${helper.prenom} ${helper.nom} à cette adresse email : <a href="mailto:${helper.email}">${helper.email}</a>. Cette personne est à moins de ${maxDistance / 1000} km de vous.</p><p>Bonne prise de contact :)</p></div>`,
        })
          .then(result => {
            needer.helper_id = helper.id;
            Needhelp.upsert(needer, () => {
            });
            cb(null, result);
          })
          .catch(error => cb(error));
      });
    });
  };

  Needhelp.remoteMethod('matching', {
    accepts: [{
      arg: 'id',
      type: 'string',
    }, {
      arg: 'maxDistance',
      type: 'number',
    }],
    returns: {
      args: 'response',
      type: 'object',
      root: true,
    },
    http: {
      verb: 'get',
    },
  });

  Needhelp.remoteMethod('allWithMatching', {
    accepts: [{
      arg: 'maxDistance',
      type: 'number',
    }],
    returns: {
      args: 'response',
      type: 'object',
      root: true,
    },
    http: {
      verb: 'get',
    },
  });

  Needhelp.remoteMethod('sendMatching', {
    accepts: [{
      arg: 'needHelp_id',
      type: 'string',
    }, {
      arg: 'helper_id',
      type: 'string ',
    }],
    returns: {
      args: 'response',
      type: 'object',
      root: true,
    },
    http: {
      verb: 'post',
    },
  });
};
