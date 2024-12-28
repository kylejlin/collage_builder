# Collage Maker

A simple web app for making collages. You can reposition and resize images, and then download all the positions and dimensions as a JSON file. Try it [here](https://kylejlin.github.io/collage_maker)!

## User Guide

You can edit the collage by performing _actions_.
You can perform actions using the mouse and keyboard.

| **Action**                      | **Key**                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| Translate sprite                | `T`                                                             |
| Scale sprite (about its center) | `S`                                                             |
| Delete sprite                   | `D`                                                             |
| Move sprite up                  | `U`                                                             |
| Move sprite to top              | `I`                                                             |
| Move sprite down                | `J`                                                             |
| Move sprite to bottom           | `K`                                                             |
| Rename sprite                   | `N`                                                             |
| Undo action                     | `Z`                                                             |
| Redo action                     | `Y`                                                             |
| Create sprite                   | None. Read the [Exceptions section](#exceptions) for more info. |

In general, to perform an action, hover the mouse over the sprite you want to edit, and then press the corresponding key.
For example, to rename a sprite, hover the mouse over said sprite and then press `N`.
However, there are a few exceptions, described in the next section.

### Exceptions

For `T` and `S`, you need to hold down the key and move the mouse to translate or scale the sprite.
When you release the key, the sprite will be placed at the new position or scale.

For `Z` and `Y`, you do not need to hover over any sprite (since these are not sprite-specific commands).

To create a sprite, click the "Add" button next to the desired source image. Note that you must upload source images before you can create a sprite. You can upload source images by clicking the "Upload new" images.
