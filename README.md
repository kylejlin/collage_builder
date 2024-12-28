# Collage Maker

A simple web app for making collages. You can reposition and resize images, and then download all the positions and dimensions as a JSON file. Try it [here](https://kylejlin.github.io/collage_maker)!

## Commands

| **Key** | **Command**                     |
| ------- | ------------------------------- |
| `T`     | Translate sprite                |
| `S`     | Scale sprite (about its center) |
| `D`     | Delete sprite                   |
| `U`     | Move sprite up                  |
| `I`     | Move sprite to top              |
| `J`     | Move sprite down                |
| `K`     | Move sprite to bottom           |
| `N`     | Rename sprite                   |
| `Z`     | Undo action                     |
| `Y`     | Redo action                     |

Execute a command by hovering the mouse over the sprite and pressing the corresponding key.

For `T` and `S`, you need to hold down the key and move the mouse to translate or scale the sprite.
When you release the key, the sprite will be placed at the new position or scale.

For `Z` and `Y`, you do not need to hover over any sprite (since these are not sprite-specific commands).
