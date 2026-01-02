# Project-La-Tiendita-AidMatch-24-7
Public web app that anonymously matches people who need resources with people who can offer them, encourages meetups only in safe public places (especially libraries), and helps mutual aid groups across the country coordinate. Tech focus: Python, FastAPI/Flask, Postgr


**Project: La Tiendita Aid Match 24/7**

**Goal: **
A public web app that anonymously matches people who need resources with people who can offer them, while strongly encouraging meetups only in safe public locations (especially libraries/community centers). Mutual aid groups can view aggregated needs in their area.

**Target Users**

•	Individuals (anonymous users): Post needs/offers and view matches.
•	Mutual Aid Groups (organizers): View aggregated needs and filter by urgency/category for coordination.

**MVP Features**
•	Anonymous user profiles (no real name, phone, email)
•	Post: “I need…” and “I can offer…”
•	Basic matching: same city/ZIP + category + urgency
•	Strong UI safety text: meetups only in libraries/community centers
•	Mutual aid group page: signup + see aggregated needs in their area
Safety & Anonymity Rules (La Tiendita Aid Match 24/7)
Purpose: Protect users by preventing sharing of personal contact/address details and encouraging only safe public meetups. 

**Rules:**
1.	No personal address sharing
o	Users must not post home addresses, apartment numbers, or “come to my place” instructions.
2.	No direct exchange of phone/email on - platform
o	The platform does not support DMs for sharing contact info.
o	If future messaging exists, it must stay anonymous and must block contact info patterns.
3.	Only safe public meetups
o	Every match response must include this reminder:
“La Tiendita strongly encourages meeting only in public, trusted locations such as your local library or community center.” 
4.	Safety injection on key pages
o	Posting forms and match pages display:
“Do not share personal home addresses. Use a library/community center.”
5.	Moderation (basic, MVP)
o	If a post includes an address/contact info, flag it (future improvement

**ER diagram of tables**
**users table:**
	
id: 	                       Unique internal identity of a user
anonymous_handle:	           Public name (no real identity)
city:	                       Used for matching people nearby
zip_code:	                   More precise location matching
role:	                       Is this user an individual or a group
preferred_safe_locations:	   Library / community center preference
created_at:	                 When user joined (audit & debugging)

**needs table ** : To store requests for help.

id:	                         Identifies each need
user_id:	                   Which user created this need
category:	                   Food, clothing, transport, etc
description:	               Details of the request
urgency:	                   Used to prioritize matching
city:	                       Match locally
zip_code:	                   Match locally
created_at:	                 Order newest / oldest

**offers table** : To store offers of help.

id:	                         Identifies the offer
user_id:	                   Who is offering help
category:	                   Must match need category
description:	               What is being offered
quantity:	                   Optional (e.g., 5 meals)
city:	                       Local matching
zip_code:	                   Local matching
created_at:	                 Tracking

**matches table ** : To record who matched with whom and why.

id:                          Identifies each match
need_id:	                   Which need is matched
offer_id:	                   Which offer matched it
match_score:	               How good the match is
status:	                     suggested / accepted / completed
created_at:	                 Tracking

**groups table :** To store mutual aid organizations separately.

id:	                         Group identity
mutual_aid_group_name:	     Group name
city:	                       Location
region:	                     Larger area
group_profile:	             Description
created_at:	                 Tracking
