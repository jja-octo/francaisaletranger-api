'use strict';
var loopback = require('loopback');

module.exports = function (Needhelp) {
  Needhelp.matching = function (id, maxDistance, cb) {
    Needhelp.findOne({
      where: {
        id,
      },
    }, (err, needer) => {
      Needhelp.app.models.Helper.find({
        where: {
          and: [{
            gps_coordinates: {
              near: needer.gps_coordinates,
              maxDistance,
              unit: 'meters',
            },
          }, {
            nombre_hebergement: {
              gte: needer.nombre_hebergement,
            },
          }, {
            approvisionnement: needer.approvisionnement,
          }, {
            autres: needer.autres,
          }],
        },
      }, (err, foundHelperList) => {
        const preparedHelperList = foundHelperList.map((foundHelper) => {
          const neederLocation = new loopback.GeoPoint(needer.gps_coordinates);
          var helperLocation = new loopback.GeoPoint(foundHelper.gps_coordinates);
          return {
            id: foundHelper.id,
            nom: foundHelper.nom,
            prenom: foundHelper.prenom,
            nombre_hebergement: foundHelper.nombre_hebergement,
            approvisionnement: foundHelper.approvisionnement,
            autres: foundHelper.autres,
            distanceInMeters: neederLocation.distanceTo(helperLocation, {
              type: 'meters',
            }),
          };
        });
        cb(err, preparedHelperList);
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
};
