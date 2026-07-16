const { JSDOM } = require('jsdom');

(async () => {
  try {
    const dom = await JSDOM.fromURL('http://localhost:3000', {
      runScripts: 'dangerously',
      resources: 'usable'
    });

    // Wait for a few seconds to let React render
    setTimeout(() => {
      const workspace = dom.window.document.getElementById('workspace-container');
      if (workspace) {
        console.log("SUCCESS: Workspace rendered.");
      } else {
        console.log("FAILED: Workspace not found.");
        console.log("BODY:", dom.window.document.body.innerHTML);
      }
      
      const root = dom.window.document.getElementById('root');
      if (root) {
        console.log("ROOT:", root.innerHTML.substring(0, 500));
      }
      process.exit(0);
    }, 5000);
    
    dom.window.addEventListener('error', (event) => {
      console.error("DOM ERROR:", event.error);
    });
  } catch (err) {
    console.error("JSDOM ERROR:", err);
  }
})();
