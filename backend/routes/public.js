const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// POST /api/public/book - Public appointment booking from website
router.post('/book', async (req, res) => {
  try {
    const { name, email, phone, service, date, timeSlot, fee } = req.body;

    // 1. Find or create patient
    // We try to match by phone or email
    let patient = await Patient.findOne({ $or: [{ email }, { phone }] });
    
    if (!patient) {
      // Create new patient
      const names = name.split(' ');
      patient = await Patient.create({
        firstName: names[0],
        lastName: names.slice(1).join(' ') || 'Patient',
        email,
        phone,
        status: 'Active',
        source: 'Website'
      });
    }

    // 2. Resolve Doctor (Default to the first one for now, or you could pass a doctorId)
    const doctor = await Doctor.findOne(); // In a real app, you'd specify which doctor
    if (!doctor) throw new Error('No doctor found in system.');

    // 3. Create Appointment (Status: Pending)
    const appointmentDate = new Date(date);
    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      appointmentDate,
      appointmentTime: timeSlot,
      type: service.includes('Video') ? 'Video' : 'In-Person',
      status: 'Pending',
      notes: `Booked via website. Service: ${service}. Fee: ${fee}`,
      source: 'Website'
    });

    res.status(201).json({
      success: true,
      message: 'Appointment requested successfully',
      appointmentId: appointment._id
    });
  } catch (err) {
    console.error('Public booking error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
