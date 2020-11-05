export class DefaultFactory {
  server;

  constructor(server) {
    this.server = server;
  }

  async getCurrentUser(req) {
    try {
      return { username: 'elastic'};
    } catch (error) {
      throw error; 
    }
  }
}