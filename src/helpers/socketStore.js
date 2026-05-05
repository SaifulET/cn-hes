const onlineUsers = new Map();

export const addUserSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId) || new Set();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
};

export const removeUserSocket = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);

  if (!sockets) {
    return;
  }

  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(userId);
  }
};

export const getUserSocketIds = (userId) => {
  return Array.from(onlineUsers.get(userId) || []);
};

export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};
