# wordle-league
 web app for playing wordle competitively
 
 This will use a differently ordered daily solution so it does not impact your NYT Wordle stats
 
 Include an option (default) to force the same first guess on all players in a challenge. The expectation is that this will better test the human word search skils and remove some luck from a favorite start word being closer to the solution.

Allow 7 guesses if the forced start word is chosen and record failures as 9 guesses for the purposes of stats and rank.

 Include 7 day and 30 day challenges to start.

TODO:
- [X] retrieve word list, OG and NYT
- [X] Unique random version for this visit (not saved across refresh yet)
- [X] add forced random start word per team(teams not defined yet)
- [X] Render Wordle guess results properly
- [ ] Show solution on a puzzle fail
- [ ] Enable Share results to clipboard
- [ ] Enable Share through browser share native function
- [ ] save state in local browser cache like OG Wordle
- [ ] add OAUTH2 and save state with OAUTH2 
- [ ] assign teams and challenges per OAUTH2
- [ ] Ranking per challenge, team, and global
- [ ] Visualize personal stats
- [ ] Visualize stats vs. team members and global
- [ ] login a user, provide anonymous view, transition anonymous stats to OAUTH2 user when user chooses
- [ ] enable create/join/leave teams (teams is what makes it a Wordle League instead of just Wordle Challenges)
- [ ] offer choice of word set. Defaulting to original Josh Whordle
- [ ] bind puzzles to fixed time periods (assume local Day)
