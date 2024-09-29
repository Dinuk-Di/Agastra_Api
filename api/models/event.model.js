import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import EventImages from './event-images.model.js';

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {message: 'Duplicate events'},
    },
    date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    createdGrids:{
        type: DataTypes.JSON,
        allowNull: true,
    },
    gridTables:{
        type: DataTypes.JSON,
        allowNull: true,
    },
    deletedTablesMap:{
        type: DataTypes.JSON,
        allowNull: true,
    },
    lastTableNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    map: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    image:{
        type: DataTypes.TEXT('long'),
        allowNull: true,
    }
}, {
    timestamps: true,
    tableName: 'events',
});

Event.hasMany(EventImages, { foreignKey: 'eventId', sourceKey: 'id' });
EventImages.belongsTo(Event, { foreignKey: 'eventId', targetKey: 'id' });

export default Event;