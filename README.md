# Collage Maker

A simple web app for making collages. You can reposition and resize images, and then download all the positions and dimensions as a JSON file. Try it [here](https://kylejlin.github.io/collage_maker)!

## Commands

- `t`: Translate sprite
- `s`: Scale sprite (about its center)
- `d`: Delete sprite
- `u`: Move sprite up
- `i`: Move sprite to top
- `j`: Move sprite down
- `k`: Move sprite to bottom
- `n`: Rename sprite
- `z`: Undo action
- `y`: Redo action

Execute a command by hovering the mouse over the sprite and pressing the corresponding key.

For `t` and `s`, you need to hold down the key and move the mouse to translate or scale the sprite.
When you release the key, the sprite will be placed at the new position or scale.

For `z` and `y`, you do not need to hover over any sprite (since these are not sprite-specific commands).
