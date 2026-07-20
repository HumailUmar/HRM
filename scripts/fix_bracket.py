import re

with open("src/components/Recruitment.tsx", "r") as f:
    content = f.read()

content = content.replace(
"""            </div>
          </div>

          <button
            onClick={handleAutoShortlist}""",
"""            </div>
          </div>
          )}
          <button
            onClick={handleAutoShortlist}"""
)

with open("src/components/Recruitment.tsx", "w") as f:
    f.write(content)
