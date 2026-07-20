const fs = require('fs');
let content = fs.readFileSync('src/components/Recruitment.tsx', 'utf8');

const oldBlock = `        try {
          // Call evaluate-video
          const res = await fetch("/api/evaluate-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoFileName: file.name,
              candidateName: candidate.name,
              candidateRole: candidate.skills[0] || "Specialist"
            })
          });

          let score = 85;
          let summary = "Excellent verbal structures and eye contact. Communicates skills effectively.";

          if (res.ok) {
            const data = await res.json();
            score = data.score ?? 85;
            summary = data.summary ?? summary;
          }`;

const newBlock = `        try {
          // Read video as base64 to send to API
          const base64Video = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Call evaluate-video
          const res = await fetch("/api/evaluate-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoUrl: base64Video,
              candidateName: candidate.name,
              candidateRole: candidate.skills[0] || "Specialist",
              apiKey: settings.ai?.apiKey
            })
          });

          let score = 85;
          let summary = "Excellent verbal structures and eye contact. Communicates skills effectively.";

          if (res.ok) {
            const data = await res.json();
            if (!data.success) {
              alert("AI Video analysis failed: " + data.error);
              return;
            }
            score = data.score ?? 85;
            summary = data.summary ?? summary;
          } else {
             const errData = await res.json().catch(() => ({}));
             alert("AI Video analysis failed: " + (errData.error || res.statusText));
             return;
          }`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('src/components/Recruitment.tsx', content);
