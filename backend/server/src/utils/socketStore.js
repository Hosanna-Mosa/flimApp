let io = null;

const setIo = (instance) => {
  io = instance;
};

const getIo = () => io;

module.exports = { setIo, getIo };
