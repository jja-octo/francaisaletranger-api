'use strict';

module.exports = function(Helper) {
  Helper.observe('after save', function(ctx, next) {
    Helper.updatePostGISGpsCoordinates(ctx.instance.id, function(err) {
      if (err) return next(err);
      next();
    });
  });

  Helper.updatePostGISGpsCoordinates = function(id, cb) {
    const sqlStatement = 'update helper set gps_coordinates_geo=ST_POINT(gps_coordinates[0],gps_coordinates[1]) where id=$1';
    const sqlParams = [id];
    Helper.dataSource.connector.execute(sqlStatement, sqlParams, function(err) {
      cb(err);
    });
  };

};
