import os

html_file = "index.backup.html"
target_file = "src/game/scenes/GameScene.ts"

with open(html_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

out_lines = [
    "import Phaser from 'phaser';\n",
    "import { globalState } from '../state';\n",
    "import { saveGameData } from '../firebase';\n",
    "import { SFX, resumeAudio } from '../audio';\n\n"
]

# extract globals (rough match)
for i, line in enumerate(lines):
    if line.strip().startswith("let player, cursors"):
        out_lines.extend(lines[i:i+6])
        break

out_lines.append("\n")

# transform GameScene object to class
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if line.strip().startswith("const GameScene = {"):
        start_idx = i
        break

for i in range(start_idx, len(lines)):
    if line.strip().startswith("function initGame() {"):
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    scene_code = "".join(lines[start_idx:end_idx])
    
    # Simple replace to change `const GameScene = {` to `export default class GameScene extends Phaser.Scene {`
    scene_code = scene_code.replace("const GameScene = {", "export default class GameScene extends Phaser.Scene {\n    constructor() {\n        super({ key: 'GameScene' });\n    }")
    scene_code = scene_code.replace("key: 'GameScene',", "")
    scene_code = scene_code.replace("create: function () {", "create() {")
    scene_code = scene_code.replace("update: function (time, delta) {", "update(time: number, delta: number) {")
    
    # The original GameScene object ends with `};` but the python script might capture the closing brace.
    # It's followed by function initGameState()
    scene_code = scene_code.replace("        };", "        }")
    
    out_lines.append(scene_code)

out_lines.append("\n// Add missing type for __firebase_config if used")

with open(target_file, 'w', encoding='utf-8') as f:
    f.writelines(out_lines)

print("GameScene extracted to", target_file)
