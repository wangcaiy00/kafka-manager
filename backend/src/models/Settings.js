const { DataTypes } = require('sequelize');
const sequelize = require('../db/database');

const Settings = sequelize.define('Settings', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  value: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});

module.exports = Settings;
