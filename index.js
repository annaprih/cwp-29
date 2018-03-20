const Sequelize = require("sequelize");
const fs = require("fs");
const Promise = require("bluebird");
const express = require("express");
const { buildSchema } = require("graphql");
const graphqlHttp = require("express-graphql");

const config = require("./config");

const db = require("./models")(Sequelize, config);
//const schema = require('./schema')(db);
const schema = buildSchema(fs.readFileSync("./tnmt.graphql").toString());
const fillWithTestData = require("./models/test-data");

const app = express();

app.listen = Promise.promisify(app.listen).bind(app);


const services = (function() {
  async function getPizzas(obj, args) {
    let limit = parseInt(obj.limit);
    if (isNaN(limit)) {
      limit = 4;
    }
    let order = obj.order;
    if (order !== "ASC" && order !== "DESC") {
      order = "ASC";
    }
    return await db.pizzas.findAll({
      raw: true,
      limit: limit,
      order: [["name", order]]
    });
  }
  async function getWeapons(obj, args) {
    let limit = parseInt(obj.limit);
    if (isNaN(limit)) {
      limit = 4;
    }
    let order = obj.order;
    if (order !== "ASC" && order !== "DESC") {
      order = "ASC";
    }
    return await db.weapons.findAll({
      raw: true,
      limit: limit,
      order: [["name", order]]
    });
  }
  async function getTurtles(obj, args) {
    let pizzas = obj.pizzas === null ? [] : obj.pizzas;
    const result = await db.turtles.findAll({
      include: [
        {
          model: db.pizzas,
          as: "favoritePizza",
          where: {
            name: {
              [Sequelize.Op.or]: pizzas
            }
          }
        },
        {
          model: db.pizzas,
          as: "secondFavoritePizza"
        },
        {
          model: db.weapons,
          as: "weapon"
        }
      ]
    });
    console.log(result);
    return result;
  }
  async function createTurtle(obj, args) {
    let temp = await db.turtles.create(obj);
    return await readTurtle(temp.id);
  }
  async function deleteTurtle(obj, args) {
    let temp =  await readTurtle(obj.id);
    await db.turtles.destroy({ where: { id: obj.id }, limit: 1 });
    return temp;
  }
  async function updateTurtle(obj, args) {
    let id = obj.id;
    await db.turtles.update(obj, { where: { id: id }, limit: 1 });

    return await readTurtle(id);
  }
  async function readTurtle(id) {
    return await db.turtles.findById(id, {
      include: [
        {
          model: db.pizzas,
          as: "favoritePizza"
        },
        {
          model: db.pizzas,
          as: "secondFavoritePizza"
        },
        {
          model: db.weapons,
          as: "weapon"
        }
      ]
    });
  }
  return { getPizzas, getWeapons, getTurtles, createTurtle,deleteTurtle, updateTurtle,readTurtle };
})();
const root = {
  weapons: (obj, args) => services.getWeapons(obj, args),
  pizzas: (obj, args) => services.getPizzas(obj, args),
  turtles: (obj, args) => services.getTurtles(obj, args),
  turtle: (obj, args) => services.readTurtle(obj.id),
  pizza: (obj, args) => db.pizzas.findById(obj.id, { raw: true }),
  weapon: (obj, args) => db.weapons.findById(obj.id, { raw: true }),
  createTurtle: (obj, args) => services.createTurtle(obj, args),
  deleteTurtle: (obj, args) => services.deleteTurtle(obj, args),
  updateTurtle: (obj, args) => services.updateTurtle(obj, args)
};
app.use(
  graphqlHttp({
    schema,
    rootValue: root,
    pretty: true,
    graphiql: true
  })
);
(async function() {
   await fillWithTestData(db);

  await app.listen(config.port);

  console.log(`Server running at http://localhost:${config.port}`);
})();
