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
};
