// Demo data generator for testing statistics visualization
export const generateDemoEvents = () => {
  const categories = [
    "Technology",
    "Music",
    "Sports",
    "Business",
    "Education",
    "Arts",
  ];
  const locations = [
    "Jakarta",
    "Bandung",
    "Surabaya",
    "Yogyakarta",
    "Semarang",
    "Malang",
  ];

  const demoEvents = [];
  const currentDate = new Date();

  // Generate events for the last 2 years
  for (let i = 0; i < 50; i++) {
    const eventDate = new Date(currentDate);
    eventDate.setDate(eventDate.getDate() - Math.floor(Math.random() * 730)); // Random date within 2 years

    const totalSeats = Math.floor(Math.random() * 500) + 50; // 50-550 seats
    const availableSeats = Math.floor(Math.random() * totalSeats);
    const revenue = Math.floor(Math.random() * 5000000) + 1000000; // 1M-6M IDR

    demoEvents.push({
      id: i + 1,
      event_name: `${
        categories[Math.floor(Math.random() * categories.length)]
      } Event ${i + 1}`,
      event_description: `This is a demo event for testing statistics visualization.`,
      event_location: locations[Math.floor(Math.random() * locations.length)],
      event_start_date: eventDate.toISOString(),
      event_end_date: new Date(
        eventDate.getTime() + 24 * 60 * 60 * 1000
      ).toISOString(), // 1 day later
      total_seats: totalSeats,
      available_seats: availableSeats,
      event_category: categories[Math.floor(Math.random() * categories.length)],
      event_thumbnail: "",
      created_at: new Date(
        eventDate.getTime() - 30 * 24 * 60 * 60 * 1000
      ).toISOString(), // 30 days before event
      revenue: revenue,
      attendees: totalSeats - availableSeats,
    });
  }

  return demoEvents;
};

export const calculateDemoStats = (events: any[]) => {
  return {
    totalEvents: events.length,
    totalSeats: events.reduce((sum, event) => sum + event.total_seats, 0),
    totalRevenue: events.reduce((sum, event) => sum + (event.revenue || 0), 0),
    activeEvents: events.filter(
      (event) => new Date(event.event_start_date) > new Date()
    ).length,
  };
};
