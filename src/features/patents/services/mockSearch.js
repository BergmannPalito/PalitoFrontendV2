export function mockSearch(pubNumber) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id   : pubNumber,
          name : pubNumber,
          description: `<p>Description for <strong>${pubNumber}</strong></p>`,
          claims     : `<p>No claims yet.</p>`,
          images     : '',
        });
      }, 750);
    });
  }