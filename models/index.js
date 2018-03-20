module.exports = (Sequelize, config) => {
  const options = {
    host: config.db.host,
    dialect: "mysql",
    logging: false,
    define: {
      timestamps: true
    }
  };

  const sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    options
  );

  const Turtle = require("../models/turtle")(Sequelize, sequelize);
  const Pizza = require("../models/pizza")(Sequelize, sequelize);
  const Weapon = require("../models/weapon")(Sequelize, sequelize);


  Turtle.belongsTo(Weapon, {
    as: "weapon",
    foreignKey: "weaponId"
  });
  Turtle.belongsTo(Pizza, {
    as: "favoritePizza",
    foreignKey: "favoritePizzaId"
  });
  Turtle.belongsTo(Pizza, {
    as: "secondFavoritePizza",
    foreignKey: "secondFavoritePizzaId"
  });

  return {
    turtles: Turtle,
    pizzas: Pizza,
    weapons: Weapon,

    sequelize: sequelize,
    Sequelize: Sequelize,
    Op: Sequelize.Op
  };
};
