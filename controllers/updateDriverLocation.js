exports.updateDriverLocation = async (req, res) => {
    try {
      const { driverLat, driverLong } = req.body;
  
      if (!driverLat || !driverLong) {
        return res.status(400).json({ message: "Latitude and longitude are required." });
      }
  
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { driverLat, driverLong },
        { new: true }
      );
  
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
  
      res.json({ message: "Location updated successfully.", user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  