const OpenAI = jest.fn(() => ({
  beta: {
    assistants: {
      list: jest.fn(),
    },
    threads: {
      create: jest.fn(),
    },
  },
}));

export default OpenAI;
