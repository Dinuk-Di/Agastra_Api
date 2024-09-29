import { DataTypes } from 'sequelize';
import sequelize from '../database.js';
import Event from './event.model.js';
import User from './user.model.js';


const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id',
    },
  },
  event_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Event,
      key: 'id'
    },
  },
  table_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  is_booked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'bookings',
  indexes:[
    {
      unique: true,
      fields: ['event_id', 'table_number']
    }
  ]
});

// Define associations after all models are imported
User.hasOne(Booking, { foreignKey: 'userId' });
Booking.belongsTo(User, { foreignKey: 'userId' });

Event.hasMany(Booking, { foreignKey: 'event_id' });
Booking.belongsTo(Event, { foreignKey: 'event_id' });

export default Booking;
