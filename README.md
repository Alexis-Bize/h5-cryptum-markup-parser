# [Halo 5] Cryptum - Markup Parser

[![N|Solid](https://i.imgur.com/YhIwCPL.png)](https://www.twitter.com/_SuckMyLuck)
### What is that?
Markup Parser converts .bin markup files to JSON. Those markups are used in **Halo 5** by the game mode options system to list and define allowed settings for a selected game base variant.

### But, why?
Once converted, each values for each settings are human-readable and may be used in game variants blob files to inject non-supported values. Examples: [No Weapon Start](https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/game-variants?lastModifiedFilter=Everything&sortOrder=BookmarkCount&page=1&gamertag=X3CXeX%20v3#ugc_halo-5-guardians_xbox-one_gamevariant_X3CXeX%20v3_b768f833-878b-4e15-96e3-8e84675b553c), [Extended Motion Sensor (91m)](https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/game-variants?lastModifiedFilter=Everything&sortOrder=BookmarkCount&page=1&gamertag=X3CXeX%20v3#ugc_halo-5-guardians_xbox-one_gamevariant_X3CXeX%20v3_66681a69-8096-42c5-8df1-a89b21974cf1), [Weapons Damage Disabled](https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/game-variants?lastModifiedFilter=Everything&sortOrder=BookmarkCount&page=1&gamertag=X3CXeX%20v3#ugc_halo-5-guardians_xbox-one_gamevariant_X3CXeX%20v3_9b16f28b-f26d-494d-9dac-3378c84bcd01), and [many others](https://www.halowaypoint.com/en-us/games/halo-5-guardians/xbox-one/game-variants?lastModifiedFilter=Everything&sortOrder=BookmarkCount&page=1&gamertag=X3CXeX%20v3). Right, **mod** is the word.

### How can I retrive a markup?
Everything you need might be found on the [content-hacs API](https://content-hacs.svc.halowaypoint.com/contents/GameVariantDefinition).
Few examples: [Slayer Markup (EN)](https://content.halocdn.com/media/Default/Hopper-Files/Generated/94054-17-07-06-2300-0/EditableOptionsDefinition/Slayer_CustomGamesUIMarkup_en.bin), [Capture The Flag (EN)](https://content.halocdn.com/media/Default/Hopper-Files/Generated/94054-17-07-06-2300-0/EditableOptionsDefinition/CaptureTheFlag_CustomGamesUIMarkup_en.bin), and [Strongholds (FR)](https://content.halocdn.com/media/Default/Hopper-Files/Generated/94054-17-07-06-2300-0/EditableOptionsDefinition/Strongholds_CustomGamesUIMarkup_fr.bin).

### Documentation
Via `require`:
```javascript
var MarkupParser = require('h5-cryptum-markup-parser');

MarkupParser.setFilePath('path/to/markup_file.bin');
MarkupParser.setOutputFolder('path/output'); // Not mandatory - View only
MarkupParser.setFileEncoding('utf-8'); // Not mandatory - Default

MarkupParser.readFile((err, result) => {
    console.log(err, result);
});
```

### Want to contribute?
Feel free to open a pull request on [GitHub](https://github.com/Alexis-Bize/h5-cryptum-markup-parser)!

### Licence
MIT