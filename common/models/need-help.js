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
      const sqlStatement = 'select id, st_distance(gps_coordinates_geo,st_point($1,$2)) from helper where ST_DWithin(gps_coordinates_geo,st_point($1,$2), $3)'
      const sqlParams = [needer.gps_coordinates.lng, needer.gps_coordinates.lat, maxDistance]
      Needhelp.dataSource.connector.query(sqlStatement, sqlParams, (err, data) => {
        const ids = data.map(record=>record.id)
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
                  garde_enfants: needer.garde_enfants,
                }],
              },
            ],
          },
        }, (err, foundHelperList) => {
          const preparedHelperList = foundHelperList.map((foundHelper) => {
            const neederLocation = new loopback.GeoPoint(needer.gps_coordinates);
            var helperLocation = new loopback.GeoPoint(foundHelper.gps_coordinates);

            function scoring(foundHelper) {
              let score = 0;

              score += (savedNeeder.nombre_hebergement > 0 && savedNeeder.nombre_hebergement >= foundHelper.nombre_hebergement) ? 1 : 0;
              score += (savedNeeder.approvisionnement && savedNeeder.approvisionnement === foundHelper.approvisionnement) ? 1 : 0;
              score += (savedNeeder.autres && savedNeeder.autres === foundHelper.autres) ? 1 : 0;
              score += (savedNeeder.garde_enfants && savedNeeder.garde_enfants === foundHelper.garde_enfants) ? 1 : 0;

              return score;
            }

            return {
              id: foundHelper.id,
              nom: foundHelper.nom,
              prenom: foundHelper.prenom,
              nombre_hebergement: foundHelper.nombre_hebergement,
              approvisionnement: foundHelper.approvisionnement,
              garde_enfants: foundHelper.garde_enfants,
              autres: foundHelper.autres,
              scoring: scoring(foundHelper),
              distanceInMeters: neederLocation.distanceTo(helperLocation, {
                type: 'meters',
              }),
            };
          });
          cb(err, preparedHelperList);
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

  Needhelp.sendMatching = function (needHelp_id, helper_id, cb) {
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
            Needhelp.upsert(needer, ()=>{});
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
