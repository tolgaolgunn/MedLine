// models/prescriptionItemModel.js - Güncellenmiş versiyon
const { pool } = require('../config/db');

class PrescriptionItem {
  static async create(client, itemData) {
    const query = {
      text: `INSERT INTO prescription_items (
        prescription_id, medicine_name, dosage, frequency, 
        duration, usage_instructions, side_effects, quantity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      values: [
        itemData.prescriptionId,
        itemData.medicineName,
        itemData.dosage,
        itemData.frequency,
        itemData.duration,
        itemData.usageInstructions || null,
        itemData.sideEffects || null,
        itemData.quantity || 1
      ]
    };

    const result = await client.query(query);
    return result.rows[0];
  }

  static async findByPrescriptionId(prescriptionId) {
    const query = {
      text: `SELECT * FROM prescription_items 
             WHERE prescription_id = $1 
             ORDER BY item_id`,
      values: [prescriptionId]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  static async update(itemId, updateData) {
    const query = {
      text: `UPDATE prescription_items 
             SET medicine_name = COALESCE($1, medicine_name),
                 dosage = COALESCE($2, dosage),
                 frequency = COALESCE($3, frequency),
                 duration = COALESCE($4, duration),
                 usage_instructions = COALESCE($5, usage_instructions),
                 side_effects = COALESCE($6, side_effects),
                 quantity = COALESCE($7, quantity)
             WHERE item_id = $8 
             RETURNING *`,
      values: [
        updateData.medicineName,
        updateData.dosage,
        updateData.frequency,
        updateData.duration,
        updateData.usageInstructions,
        updateData.sideEffects,
        updateData.quantity,
        itemId
      ]
    };

    const result = await pool.query(query);
    return result.rows[0];
  }

  // Yeni eklenen method'lar
  static async findById(itemId) {
    const query = {
      text: `SELECT * FROM prescription_items WHERE item_id = $1`,
      values: [itemId]
    };

    const result = await pool.query(query);
    return result.rows[0];
  }

  static async deleteByPrescriptionId(client, prescriptionId) {
    const query = {
      text: `DELETE FROM prescription_items WHERE prescription_id = $1 RETURNING *`,
      values: [prescriptionId]
    };

    const result = await client.query(query);
    return result.rows;
  }

  static async deleteById(client, itemId) {
    const query = {
      text: `DELETE FROM prescription_items WHERE item_id = $1 RETURNING *`,
      values: [itemId]
    };

    const result = await client.query(query);
    return result.rows[0];
  }

  // Belirli bir ilacın tüm kayıtlarını getir
  static async findByMedicineName(medicineName) {
    const query = {
      text: `SELECT pi.*, p.patient_id, p.doctor_id, p.created_at as prescription_date
             FROM prescription_items pi
             JOIN prescriptions p ON pi.prescription_id = p.prescription_id
             WHERE LOWER(pi.medicine_name) LIKE LOWER($1)
             ORDER BY p.created_at DESC`,
      values: [`%${medicineName}%`]
    };

    const result = await pool.query(query);
    return result.rows;
  }

  // Toplam ilaç sayısını getir
  static async countByPrescriptionId(prescriptionId) {
    const query = {
      text: `SELECT COUNT(*) as total FROM prescription_items WHERE prescription_id = $1`,
      values: [prescriptionId]
    };

    const result = await pool.query(query);
    return parseInt(result.rows[0].total);
  }

  // Batch update - birden fazla item'ı güncelle
  static async updateBatch(client, prescriptionId, itemsData) {
    // Önce mevcut item'ları sil
    await this.deleteByPrescriptionId(client, prescriptionId);
    
    // Yeni item'ları ekle
    const createdItems = [];
    for (const itemData of itemsData) {
      const item = await this.create(client, {
        prescriptionId,
        ...itemData
      });
      createdItems.push(item);
    }
    
    return createdItems;
  }
}

module.exports = PrescriptionItem;