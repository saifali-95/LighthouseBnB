const properties = require('./json/properties.json');
const users = require('./json/users.json');
const {Pool} = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query(`SELECT * FROM users WHERE email = $1`,[email])
          .then((data) => {
            return data.rows[0]
          })
          .catch(err => console.log(err))
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool.query(`SELECT * FROM users WHERE id = $1`,[id])
          .then((data) => {
            return data.rows
          })
          .catch(err => console.log(err))
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool.query(`INSERT INTO users(name, email, password) VALUES($1,$2,$3) RETURNING *;`,[user.name, user.email, user.password])
          .then((data) => { 
            return data.rows
          })
          .catch(err => console.log(err))
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query(`SELECT * FROM reservations JOIN users ON users.id = guest_id JOIN properties ON property_id = properties.id WHERE guest_id = $1 LIMIT $2;`,[guest_id, limit])
          .then((data) => {
            return data.rows
          })
          .catch(err => console.log(err))
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  WHERE 1=1
  `;
  // 3 IF A USER FILL OUT ALL THE SEARCH FIELD, IT WILL SEND THE QUERY ACCORDING
  
  if (options.city && options.minimum_price_per_night && options.maximum_price_per_night &&  options.minimum_rating) {
    queryParams.push(`%${options.city}%` , `${options.minimum_price_per_night*99}` ,`${options.maximum_price_per_night*99}`, `${options.minimum_rating}`);
    queryString += `AND city LIKE $1 AND cost_per_night > $2 AND cost_per_night < $3 AND rating > $4`;
  }
  
  // 3 IF A USER FILL OUT ONLY CITY SEARCH FIELD, THEN ALL THE PROPERTIES IN THAT AREA WILL BE DISPLAYED

  else if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `AND city LIKE $${queryParams.length}`;
  }

  // 4
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5 RETURN PROMISE
  return pool.query(queryString, queryParams).then((res) => res.rows); 
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  
  const inputParams = [property.owner_id, property.title, property.description, property.number_of_bedrooms, property.number_of_bathrooms, property.parking_spaces, property.cost_per_night, property.thumbnail_photo_url, property.cover_photo_url, property.street, property.country, property.city, property.province, property.post_code];

  const input = `
    INSERT INTO properties (owner_id, title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url, cover_photo_url, street, country,city,province, post_code)   
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ` ;
  return pool.query(input, inputParams).then((res) => res.rows);
  
}
exports.addProperty = addProperty;
