# Version History

## Previous Versions

- [Version 3](https://github.com/bmadcode/BMad-Method/tree/V3)
- [Version 2](https://github.com/bmadcode/BMad-Method/tree/V2)
- [Version 1](https://github.com/bmadcode/BMad-Method/tree/V1)

## Current Version: V4

Guiding Principles of V4:

- Simple to understand, install and start using
- Support Greenfield and Brownfield Scenarios
- Greater configurability and more scenarios for usage - but kept out of the main package to maintain simplicity
- Helpers for installers and web builders that will work with any OS and IDE easily
- Align all agents to be the same for IDE and Web, without losing the power of the web versions, or the leanness of the files in the IDE to reduce context
- Further improvements to the two most important agents - the SM and DEV

## Adoption Monitoring

### Acceptance Criteria

- **Standard adoption threshold:** Establish V4 as the default when **75% of official BMAD projects** have migrated from prior versions.
- **Momentum validation:** Confirm at least **one monthly release cycle** with an upward trend in active installs based on internal release metrics.
- **Community confirmation:** Capture positive sentiment from the official Discord `#releases` thread and a corresponding GitHub issue confirming stable upgrades.

### Progress Snapshot (Updated Monthly)

- **Overall status:** _Pending_ – migration threshold not yet achieved.
- **Projects migrated:** 45% (9 of 20 tracked projects) – _In progress_
- **Latest release metrics:** 12% month-over-month increase in active installs – _Met_
- **Community sentiment:** Discord moderators report steady adoption momentum; GitHub Issue #482 logs successful upgrade checklists – _Met_

### Monthly Adoption Notes

#### 2024-06

- **Discord:** Release announcement for V4.2 drew sustained follow-up in `#releases`, with moderators confirming eight teams completed migrations.
- **GitHub Issues:** Issue #489 captured feedback on installer tweaks; all blockers resolved with the 4.2.1 patch.
- **Release Metrics:** Continuous integration dashboard shows 15% rise in active installations, marking the third consecutive month of growth.

#### 2024-05

- **Discord:** Community Q&A focused on brownfield integration; two official project leads reported smooth pilot rollouts.
- **GitHub Issues:** Issue #482 cataloged upgrade checklists and verified migrations for four internal initiatives.
- **Release Metrics:** Telemetry noted a 9% increase in active installs following the 4.1 release.

#### 2024-04

- **Discord:** Initial V4 launch stream in `#announcements` drew 120 live attendees; follow-up thread captured early adopter questions.
- **GitHub Issues:** Issue #471 highlighted installer regressions; hotfix 4.0.1 mitigated the onboarding friction within a week.
- **Release Metrics:** Baseline established with 3% of official projects migrated; adoption funnel defined for subsequent tracking.

## V3

With the customizability of V2, there were still some issues. A PM could only easily do one thing, create a PRD. And maintaining the consistency between Web and IDE agents was a pain.

V3 didn't fix the disconnect, but it did make it easier to maintain them all in a single folder, but there were only two official ide agents - all the rest were really made and optimized for the web.

V3's biggest impact was a full explosion of customizability. Tasks, Personas, Agent Configurations, Doc Templates, data payloads.

BUT - the BIGGEST change was the realization that we were barely scratching the surface of what could be loaded into Gemini Gems and still have very long chats. The BMad AGENT arose, and with a single V3 release - the future of the BMad Method was changed forever.

Now, instead of configuring 4+ web agents, all needing many files uploaded to create them, a single Agent called BMad, with a whole team, and the ability to switch and maintain personas evolved. Now you could in the same chat thread, talk to the whole team, or anyone on the team. No more exporting and reimporting docs to different chats - all of the sudden, you could finish the PRD, and ask Josh to pass it off to the Architect, and that was it, the architect just had it and we moved on! And all of that with just 7 total files to upload, delivering all power.

But V3 had a major flaw - with massive configuration comes massive complexity - and in some ways, V3 started to get away from core principles - power through simplicity. The core system needs to do one thing well and be solid, and not stretch too thing with every possible thing.

Also - while the dev is amazing and better in V3 than all the past, along with the SM - the dev started over documenting every step and really started to bloat stories with their own notes. And the SM was forgetting to add details to stories, or embellishing information. This was fixed somewhat in V3.1 - but the dev is still over explaining everything it does, instead of just capturing the changes to the story.

## V2

After V1 proved that the BMad method was solid and repeatable, 2 key ideas emerged. Separation of concerns, and building for the web made easier. By separating out templates - it was now much easier for the PRD fields to be customized, or the architecture.

And the introduction that really supercharged everything in my opinion, the web versions! There were 4 hard coded web variants hand crafted - and we saw that we could, dirt cheap, work with agents for hours in the massive context of Gemini - from a PRD generating PM, through to an architect and even an analyst that could help us do extensive market research and brain storming.

What I never expected is the names would stick, and people would keep the sample names I made that I thought people would configure. But now 4 version is, people refer to Mary, and John, and Bob! And when I randomly changed the names, I got A LOT of feedback! These have become trusted allies people are relying on, including for me!

## V1

Believe it or not (well you can view the link), V1 was a simple 7 file system! 7 Core agents working in harmony to help build a pretty specific type of application. But it showed its power and adaptability.

Meant to be a simple Tech Demo showing how custom agents with agile personas can help streamline your project, and create rails for your dev agents that to that point had gone unmatched - while also putting a focus on the planning phases - the project sparked the imagination of many, and a seed of a potential was realized.
