"use strict";

const db = require("../db");
const { sqlPartialUpdate } = require("../helpers/sql-partial-update")
const { NotFoundError } = require("../expressError");

/** Related functions for list_items. */

class ListItem {

  /** Find all items.
  * Returns [{ list_id, id, category, item, qty }, ...]
  **/
  static async findAll() {
    const res = await db.query(
      `SELECT list_items.id,
      list_items.list_id,
      list_items.category,
      list_items.item,
      list_items.qty
      FROM list_items
      LEFT JOIN destination_lists ON destination_lists.id = list_items.list_id`
    );
    const listItems = res.rows;

    if (!listItems) {
      console.log('No Items Found')
      throw new NotFoundError('No Items Found')
    };

    return listItems;
  }

  /** Find all items by given list_id.
  * Returns [{ list_id, id, category, item, qty }, ...]
  **/
  static async findAllForList(list_id) {
    const res = await db.query(
      `SELECT list_items.id,
      list_items.list_id,
      list_items.category,
      list_items.item,
      list_items.qty
      FROM list_items
      LEFT JOIN destination_lists ON destination_lists.id = list_items.list_id
      WHERE list_items.list_id = $1`, [list_id]
    );
    const listItems = res.rows;

    if (!listItems) {
      console.log('No Items Added To List Yet')
      // throw new NotFoundError('No Items Added To List Yet')
    };

    return listItems;
  }

  /** Given a list_item id, return data about list
   *
   * Returns { list_id, id, category, item, qty }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(listItems_id) {
    const res = await db.query(
      `SELECT list_items.id,
              list_items.list_id,
              destination_lists.searched_address,
              destination_lists.arrival_date,
              destination_lists.departure_date,
              list_items.category,
              list_items.item,
              list_items.qty
      FROM list_items
      LEFT JOIN destination_lists ON destination_lists.id = list_items.list_id
      WHERE list_items.id = $1`,
      [listItems_id]
    );

    const listItem = res.rows[0];

    if (!listItem) {
      console.log(`Item not found: ${listItems_id}`)
      throw new NotFoundError(`Item not found: ${listItems_id}`)
    };

    return listItem;
  }

  /** Create listItem with data.
   *
   * Returns { searched_address, arrival_date, departure_date }
   *    where list_items is { category, item, qty }
   *
   **/

  static async create(list_id, data) {
    const res = await db.query(
      `INSERT INTO list_items 
              (list_id,
              category,
              item,
              qty) 
      VALUES ($1, $2, $3, $4)
      RETURNING id, list_id, category, item, qty`,
      [
        list_id,
        data.category,
        data.item,
        data.qty
      ]);
    let listItem = res.rows[0];
    return listItem;
  }

  /** Update list_item with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { category, item, qty }
   *
   * Returns: { list_id, id, item, qty }
   *
   * Throws NotFoundError if not found.
   */
  static async update(listItem_id, data) {
    //convert submitted data to useable syntax for request
    const { setCols, values } = sqlPartialUpdate(
      data,
      {
        category: "category",
        item: "item",
        qty: "qty"
      });

    const listItemIdIdx = "$" + (values.length + 1);
    console.log("list item index -", listItemIdIdx)

    const sqlQuery = `UPDATE list_items
                      SET ${setCols}
                      WHERE id = ${listItemIdIdx}
                      RETURNING id, list_id, category, item, qty`;

    const result = await db.query(sqlQuery, [...values, listItem_id]);
    const updatedItem = result.rows[0];

    if (!updatedItem) {
      console.log(`No item found: ${listItem_id}`)
      throw new NotFoundError(`No item found: ${listItem_id}`)
    };
    return updatedItem;
  }

  /** Delete given list_item from database; returns undefined. */
  static async remove(listItem_id) {
    let result = await db.query(
      `DELETE
      FROM list_items
      WHERE id = $1
      RETURNING id`,
      [listItem_id]
    );
    const item = result.rows[0]

    if (!item) {
      console.log(`No item found: ${listItem_id}`)
      throw new NotFoundError(`No item found: ${listItem_id}`)
    };
  }

}

module.exports = ListItem
