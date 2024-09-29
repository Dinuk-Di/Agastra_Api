import { DataTypes } from "sequelize";
import sequelize from "../database.js";

const EventImages = sequelize.define(
  'EventImages',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    eventId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'events',
        key: "id",
      },
      allowNull: false,
    },
    image_id:{
      type: DataTypes.STRING,
      allowNull: false,
    },
    image: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "event_images",
  }
);

export default EventImages;
