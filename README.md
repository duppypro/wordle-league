# wordle-league
 web app for playing wordle competitively
 
 This will use a differently ordered daily solution so it does not impact your NYT Wordle stats
 
 Include an option (default) to force the same first guess on all players in a challenge. The expectation is that this will better test the human word search skils and remove some luck from a favorite start word being closer to the solution.

Allow 7 guesses if the forced start word is chosen and record failures as 9 guesses for the purposes of stats and rank.

 Include 7 day and 30 day challenges to start.

TODO:
- [X] retrieve word list, OG and NYT
- [ ] Unique random version for this site (one off or seed based?)
- [ ] pick from list browser local time
- [ ] add forced random start word per team(teams not defined yet)
- [ ] Render Wordle guess results properly
- [ ] define teams from team UUID in URL
- [ ] save state in local browser cache like OG Wordle
- [ ] add OAUTH2 and save state with OAUTH2 
- [ ] assign teams and challenges per OAUTH2
- [ ] Ranking per challenge, team, and global
- [ ] Visualize personal stats
- [ ] Visualize stats vs. team members and global
