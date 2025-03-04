'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Files', 'url', {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true
    });
  },
};
