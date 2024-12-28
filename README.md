# Collage Maker

A simple web app for making collages. You can reposition and resize images, and then download all the positions and dimensions as a JSON file. Try it [here](https://kylejlin.github.io/collage_maker)!

## User Guide

You can edit the collage by performing _actions_.
You can perform actions using the mouse and keyboard.

| **Action**                      | **Key**                                                   |
| ------------------------------- | --------------------------------------------------------- |
| Translate sprite                | `T`                                                       |
| Scale sprite (about its center) | `S`                                                       |
| Delete sprite                   | `X`                                                       |
| Duplicate sprite                | `D`                                                       |
| Copy width                      | `W` Read the [Details section](#details) for more info.   |
| Copy height                     | `H` Read the [Details section](#details) for more info.   |
| Paste                           | `V` Read the [Details section](#details) for more info.   |
| Move sprite up                  | `U`                                                       |
| Move sprite to top              | `I`                                                       |
| Move sprite down                | `J`                                                       |
| Move sprite to bottom           | `K`                                                       |
| Rename sprite                   | `N`                                                       |
| Undo action                     | `Z`                                                       |
| Redo action                     | `Y`                                                       |
| Create sprite                   | None. Read the [Details section](#details) for more info. |

In general, to perform an action, hover the mouse over the sprite you want to edit, and then press the corresponding key.
For example, to rename a sprite, hover the mouse over said sprite and then press `N`.
However, there are a few exceptions to this pattern, described in the next section.

### Details

For `T` and `S`, you need to hold down the key and move the mouse to translate or scale the sprite.
As long as you hold down the key, the sprite will move or scale with the mouse.
Once you release the key, the sprite will no longer move or scale with the mouse.

If you press `W`, the width of the sprite that the mouse is hovering over is saved to the _paste buffer_. The _paste mode_ is set to "width".

The `H` key behaves similarly, except it saves height instead of width.

When you press `V`, if the paste mode is "width", then this sets the width of the sprite that the mouse is hovering over to the value stored in the paste buffer.
If the paste mode is "height", then this sets the height of the sprite that the mouse is hovering over to the value stored in the paste bufer.

For `Z` and `Y`, you do not need to hover over any sprite (since these are not sprite-specific commands).

To create a sprite, click the "Add" button next to the desired source image. Note that you must upload source images before you can create a sprite. You can upload source images by clicking the "Upload new" images.
