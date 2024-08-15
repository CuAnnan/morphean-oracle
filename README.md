# Morphean Oracle

## A Changeling the Dreaming Dice Rolling bot for discord.

If you use the Changeling the Dreaming [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1geNpOIoT714U-zvbm7G9_Dw2CR54qSW3xgjq6JqGQaU/edit?usp=sharing) to build your character sheet, by going to 

* file -&gt; share -&gt; publish to web
* entire document -&gt; web page
* publish

you will generate a link for a plain html version of your character sheet. This plain html sheet isn't particularly interesting in and of itself but, in any server that is running Morphean Oracle, you can **/fetch-sheet &lt;that url&gt;** and Morphean Oracle will be aware of your character sheet values.

**/roll 6** will roll six dice and respond with the results<br/>
**/roll 6 vs 5** will roll six dice at a difficulty of 5<br/>
**/roll Dexterity + Melee** will roll the value of your Dexterity and Melee pool. This does, in theory, allow you to roll nonsensical pools like Dexterity + Fae. But it is not the dice roller's responsibility to make sure you're rolling meaningful pools.