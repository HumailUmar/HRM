import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()


chat_old = """  const startChatScreening = () => {
    const candidate = candidates.find(c => c.id === selectedCandidateId);
    if (!candidate) return;

    const initialMsg = {
      sender: 'ai' as const,
      content: `Hello ${candidate.name}! I am Eli, your AI Recruitment Specialist here at Humail Eli. I'm excited to guide you through this interactive screening chat for the position of ${candidate.skills[0] || 'Specialist'}. To start off, could you tell me why you're interested in joining our team, and how your previous ${candidate.experienceYears} years of experience align with this role?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([initialMsg]);
  };"""

chat_new = """  const startChatScreening = () => {
    const candidate = candidates.find(c => c.id === selectedCandidateId);
    if (!candidate) return;

    const initialMsg = {
      sender: 'ai' as const,
      content: activeJd 
        ? `Hello ${candidate.name}! I am Eli, your AI Recruitment Specialist. I'll be conducting your screening for the ${activeJd.title} role in ${activeJd.department}. Our first question from our structured evaluation: ${activeJd.evaluationDimensions[0]?.questions[0]?.question || 'Can you tell me about your relevant experience?'}`
        : `Hello ${candidate.name}! I am Eli, your AI Recruitment Specialist here at Humail Eli. I'm excited to guide you through this interactive screening chat for the position of ${candidate.skills[0] || 'Specialist'}. To start off, could you tell me why you're interested in joining our team, and how your previous ${candidate.experienceYears} years of experience align with this role?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([initialMsg]);
  };"""

content = content.replace(chat_old, chat_new)


voice_old = """  const handleStartAIScreening = (candId: string) => {
    const candidate = candidates.find(c => c.id === candId);
    if (!candidate) return;

    setIsScreeningCallActive(true);
    setTimeout(() => {
      const scores: { [key: number]: number } = {};
      let total = 0;

      SCREENING_QUESTIONS.forEach(q => {
        const baseMin = candidate.experienceYears >= 5 ? 7 : 5;
        const score = baseMin + Math.floor(Math.random() * (11 - baseMin));
        scores[q.index] = score;
        total += score;
      });

      const updatedCand: Candidate = {
        ...candidate,
        status: 'Screened',
        screeningScores: scores,
        screeningTotalScore: total
      };"""


voice_new = """  const handleStartAIScreening = (candId: string) => {
    const candidate = candidates.find(c => c.id === candId);
    if (!candidate) return;

    setIsScreeningCallActive(true);
    setTimeout(() => {
      const scores: { [key: number]: number | string } = {};
      let total = 0;

      if (activeJd && activeJd.evaluationDimensions.length > 0) {
        let maxTotal = 0;
        activeJd.evaluationDimensions.forEach(dim => {
            const score = 3 + Math.floor(Math.random() * 3); // 3 to 5 out of 5
            scores[dim.id as any] = score;
            total += score * dim.weight;
            maxTotal += 5 * dim.weight;
        });
        total = Math.round((total / maxTotal) * 100);
      } else {
        SCREENING_QUESTIONS.forEach(q => {
          const baseMin = candidate.experienceYears >= 5 ? 7 : 5;
          const score = baseMin + Math.floor(Math.random() * (11 - baseMin));
          scores[q.index] = score;
          total += score;
        });
      }

      const updatedCand: Candidate = {
        ...candidate,
        status: 'Screened',
        screeningScores: scores,
        screeningTotalScore: total
      };"""

content = content.replace(voice_old, voice_new)


score_ui_old = """                  {selectedCandidate.screeningScores && (
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Voice Question Breakdown</h5>
                      <div className="space-y-1 max-h-[140px] overflow-y-auto border border-slate-100 bg-white p-3 rounded-lg text-[10px] font-mono">
                        {SCREENING_QUESTIONS.map(q => {
                          const sc = selectedCandidate.screeningScores?.[q.index] ?? 0;
                          return (
                            <div key={q.index} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                              <span className="font-sans font-medium text-slate-600 truncate max-w-[220px]">{q.index}. {q.question}</span>
                              <span className="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 rounded">{sc}/10</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}"""

score_ui_new = """                  {selectedCandidate.screeningScores && (
                    <div className="space-y-2">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Voice Question Breakdown</h5>
                      <div className="space-y-1 max-h-[140px] overflow-y-auto border border-slate-100 bg-white p-3 rounded-lg text-[10px] font-mono">
                        {activeJd && activeJd.evaluationDimensions.length > 0 ? (
                            activeJd.evaluationDimensions.map(dim => {
                              const sc = selectedCandidate.screeningScores?.[dim.id as any] ?? 0;
                              return (
                                <div key={dim.id} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                  <span className="font-sans font-medium text-slate-600 truncate max-w-[220px]">{dim.name} ({dim.weight}%)</span>
                                  <span className="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 rounded">{sc}/5</span>
                                </div>
                              );
                            })
                        ) : (
                            SCREENING_QUESTIONS.map(q => {
                              const sc = selectedCandidate.screeningScores?.[q.index] ?? 0;
                              return (
                                <div key={q.index} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                  <span className="font-sans font-medium text-slate-600 truncate max-w-[220px]">{q.index}. {q.question}</span>
                                  <span className="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1 rounded">{sc}/10</span>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}"""

content = content.replace(score_ui_old, score_ui_new)


with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
