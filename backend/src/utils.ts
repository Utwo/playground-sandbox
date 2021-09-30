export const getActiveRooms = (io) => {
  const arr = Array.from(io.sockets.adapter.rooms);
  // Filter rooms whose name exist in set:
  // ==> [['room1', Set(2)], ['room2', Set(2)]]
  const filtered = arr.filter((room) => !room[1].has(room[0]));

  // Return only the room name:
  return filtered.map((i) => i[0]);
};
