import re

with open("src/lib/mockData.ts", "r") as f:
    content = f.read()

audit_rules = """  statusRules: {
    enableStatusManagement: true,
    autoExpireOnLeave: false,
    autoExpireProbation: true,
    autoResignToTerminated: true,
    enableBulkStatusUpdate: true,
    allowRehireTerminated: false
  },
  auditTrailRules: {
    enableAuditTrail: true,
    trackAllFields: true,
    trackedFields: [],
    requireReason: false,
    requireReasonHighImpact: true,
    retentionPeriod: '7 years'
  }"""

content = content.replace("  statusRules: {\n    enableStatusManagement: true,\n    autoExpireOnLeave: false,\n    autoExpireProbation: true,\n    autoResignToTerminated: true,\n    enableBulkStatusUpdate: true,\n    allowRehireTerminated: false\n  }", audit_rules)

with open("src/lib/mockData.ts", "w") as f:
    f.write(content)
