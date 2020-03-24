'use strict';
var loopback = require('loopback');

module.exports = function(Needhelp) {
  Needhelp.matching = function(id, maxDistance, cb) {
    let savedNeeder;

    Needhelp.findOne({
      where: {
        id,
      },
    }, (err, needer) => {
      savedNeeder = needer;

      Needhelp.app.models.Helper.find({
        where: {
          and: [
            {
              gps_coordinates: {
                near: needer.gps_coordinates,
                maxDistance,
                unit: 'meters',
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
      });
    });
  };

  Needhelp.allWithMatching = function(maxDistance, cb) {
    Needhelp.find({
      where: {
        helper_id: null,
      },
      limit: 50,
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
        const neederLocation = new loopback.GeoPoint(needer.gps_coordinates);
        var helperLocation = new loopback.GeoPoint(helper.gps_coordinates);
        const distanceInMeters = neederLocation.distanceTo(helperLocation, {
          type: 'meters',
        });

        loopback.Email.send({
            from: process.env.MAILJET_FROM,
            to: needer.email,
            subject: `${needer.nom} nous avons trouvé un matching !`,
            text: 'Nous avons trouvé un matching !',
            html: `<div><p>La plateforme vient de vous trouver de l'aide.</p><p>Vous pouvez contacter ${helper.nom} ${helper.prenom}, il est à ${distanceInMeters} mètres de vous.</p><p>Vous pouvez le contacter à <a href="mailto:${helper.email}">l'adresse suivante.</a></p></div>`,
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
      type: 'string',
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
