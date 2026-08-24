-- GenXio roster data import, generated from 'Genxio Esports AllInOne.xlsx'.
-- Run this in the Supabase SQL editor AFTER schema.sql.
--
-- Notes:
--  * Team Roster row 28 ('Klaus', unreconciled duplicate stub) was skipped in
--    favor of the fuller 'G¹ | Klaus' entry.
--  * 'G¹ | F31TXN' and 'G¹ | Male' share the exact same WhatsApp number/handle
--    in the source sheet -- both are imported as-is; check whether they're the
--    same person before treating them as two separate roster spots.
--  * Rows with no join date default to today via the table's own default.

insert into public.members
  (ign, clan_tag, status, mode, mp_role, device, activity, comps_experience,
   scrim_availability, weapons, mp_operator, br_class, whatsapp_name,
   whatsapp_number, professional_name, uid, discord, country, device_serial_number)
values
  ('MIDE', 'G¹', 'ACTIVE', 'Hybrid', 'Slayer', 'iPhone 15 Pro', null, null, null, 'USS9', 'Annihilator', null, '~Justayomide', '+234 703 717 4541', null, null, null, null, null),  -- was row 5: MIDE
  ('Dave', 'G¹', 'ACTIVE', null, 'Slayer', 'Realme Note 70T', null, null, null, 'Outlaw', 'Annihilator', null, '~꧁༒D_king༒꧂', '+234 916 161 9276', null, null, null, null, null),  -- was row 6: Dave
  ('Grandad', 'G¹', 'ACTIVE', 'Hybrid', 'Objective & Anchor', 'iPhone 15 Pro Max', null, null, null, 'Type 19 or VMP', 'Gravity Vortex', 'Trickster', '~Grandad', '+234 701 398 8325', 'Grandad', '7136757057055096833', '@.Grandad', 'Nigeria', 'FY7D7FY60D'),  -- was row 7: Grandad
  ('ROOKIE', 'G¹', 'ACTIVE', null, 'OBJ', 'Samsung S20', null, null, null, 'USS9 / AGR', 'Gravity Vortex', null, '~ROOKIE😏', '+234 810 487 4525', null, null, null, null, null),  -- was row 8: ROOKIE
  ('YØÑÑYSKI', 'G¹', 'ACTIVE', null, 'OBJ', 'Tecno Spark 40', null, null, null, 'HSO', 'Gravity Vortex', 'Medic/Defender', 'this user hates people', '234 902 580 3475', null, null, null, null, null),  -- was row 9: YØÑÑYSKI
  ('LOLLIMOR', 'G¹', 'ACTIVE', null, 'OBJ', 'iPhone 11', null, null, null, 'Switchblade / Type 19', 'Annihilator', null, null, null, 'Lollimor', '6853572072552464385', '@lolliiii_mor', 'Nigeria', 'C6KCC0Q7N72X'),  -- was row 10: LOLLIMOR
  ('F31TXN', 'G¹', 'ACTIVE', null, 'ANCHOR', 'Samsung Galaxy S22+', null, null, null, 'MG42', 'Gravity Vortex', null, '~Bxki ダーク', '+234 802 896 5025', 'F31TXN', '6880277960273428481', 'feitan_ororo', 'Nigeria', 'RFCTA1X8DCV'),  -- was row 11: F31TXN
  ('WIRE', 'G¹', 'ACTIVE', null, 'OBJ', 'Samsung A05s', null, null, null, 'CBR4', 'Annihilator', null, '~Jahfet', '+234 916 275 7738', null, null, null, null, null),  -- was row 12: WIRE
  ('Caution', 'G¹', 'INACTIVE', null, 'OBJ', 'Samsung S9', null, null, null, 'SO14', 'Annihilator', null, '~Caution', '+234 707 042 6721', null, null, null, null, null),  -- was row 13: Caution
  ('FEMOSHE', 'G¹', 'ACTIVE', 'Hybrid', 'Slayer and Support', 'iPad 10th Gen', null, null, null, 'PP Bizon', 'Equalizer', 'Trap', '~🌅', '+234 818 741 3593', 'Olufemi', '6844978890613129217', '@Femoshe5668', 'Nigeria', 'GYN0L60LWG'),  -- was row 14: FEMOSHE
  ('KINGING', 'G¹', 'ACTIVE', null, 'Objective & Support', 'Samsung Galaxy S24 Ultra', null, null, null, 'PP Bizon', 'Gravity Spike', null, '~emilojurasak', '+234 805 741 0728', null, null, null, null, null),  -- was row 15: KINGING
  ('AKIRA', 'G¹', 'ACTIVE', null, 'Slayer', 'iPad 11 Gen', null, null, null, 'AK 117', 'Death Machine', null, '~𝓜𝓡 𝓝𝓸𝓷𝓬𝓱𝓪𝓵𝓪𝓷𝓽🫩', '+234 702 673 3537', null, null, null, null, null),  -- was row 16: AKIRA
  ('YAHOO', 'G¹', 'ACTIVE', null, 'OBJ & Support', 'iPad Pro M4', null, true, null, 'S014', 'Gravity Vortex Gun', null, '~TOJI Musky🚀🚀', '+234 813 918 7569', 'YAHOO', '7040145748394770433', '@JosephCodm', 'Nigeria', 'MJWF19Q5Q8'),  -- was row 17: YAHOO
  ('25th', 'G¹', 'ACTIVE', null, 'OBJ & Support', 'Samsung S22', null, null, null, 'QQ9', 'Gravity Vortex Gun', null, '~ikigai', '+234 902 270 7940', '25th', '6890298741627486209', '@underrated25th', 'Nigeria', 'RFCT80LRAHW'),  -- was row 18: 25th
  ('AKAZA', 'G¹', 'ACTIVE', null, 'OBJ', 'iPhone 16', null, null, null, 'USS9/Grau 5.56', 'Death Machine', null, '~King💯', '+1 (409) 651-8199', null, null, null, null, null),  -- was row 19: AKAZA
  ('Capo', 'G¹', 'ACTIVE', 'Hybrid', 'Slayer & Anchor', 'Infinix Xpad', null, null, null, 'XM-4', 'Purifier', 'Spotter/ Ninja', null, '+234 907 151 7599', 'Genio', '7142237210577141761', '@geniocreativo', 'Nigeria', '122231548T002106'),  -- was row 20: Capo
  ('Shadow', 'G¹', 'ACTIVE', 'BR', 'Slayer', 'iPhone 11', 'Low', true, true, 'Ak117', 'Shadow Blade', 'Ninja', 'Shadow', '+234 901 017 7269', null, null, null, null, null),  -- was row 21: Shadow
  ('Desaad', 'G¹', 'ACTIVE', null, null, null, null, null, null, null, null, 'Pumped', null, null, null, null, null, null, null),  -- was row 22: Desaad
  ('Fatal', 'G¹', 'ACTIVE', null, null, null, null, null, null, null, null, 'Defender', null, null, 'F8TAL', '7162302318732836865', '@richy0555', 'Nigeria', 'R58N31T8EPX'),  -- was row 23: Fatal
  ('Files', 'G¹', 'ACTIVE', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null),  -- was row 24: Files
  ('Unbroken', 'G¹', 'ACTIVE', 'BR', 'SLAYER OBJ ANCHOR', 'RedmiA7', 'Average', true, true, 'Ak117', 'Kinetic Armor', 'Ninja', 'G¹ | ÜÑẞRÖK£Ñ', '8083856873', 'ÜÑßRÖK£Ñ', '7478642692995088397', '@unbroken223', 'Nigeria', '863d00583048303634511c97a9b41d'),  -- was row 25: Unbroken
  ('Klaus', 'G¹', 'ACTIVE', 'Hybrid', 'Slayer', 'iPad pro', 'Average', true, true, 'By15, type-19', 'Other', 'Rewind', 'Fela_Back👑', '2437017578870', 'KLAUS', '7023087026899976193', '@klaus05423', 'Nigeria', 'FJJ69NN6GD'),  -- was row 26: Klaus
  ('Xs reaper', 'G¹', 'ACTIVE', 'Hybrid', null, 'iPhone 16', 'Average', false, true, null, null, null, null, null, null, null, null, null, null),  -- was row 27: Xs reaper
  ('Tinubu', 'G¹', 'ACTIVE', 'BR', null, 'iPhone 16 Pro', null, true, true, null, null, null, null, null, null, null, null, null, null),  -- was row 29: Tinubu
  ('ĐIÃMÔNÐ', 'G¹', 'ACTIVE', 'BR', null, 'iPhone 12', 'Low', false, true, 'Ak117 , BY15', 'K9-Unit', 'Trap master', 'DIAMOND', '9133843539', null, null, null, null, null),  -- was row 30: ĐIÃMÔNÐ
  ('Lola', 'G¹', 'ACTIVE', 'MP', 'slayer', 'ipad', 'Low', false, true, 'type 12', 'Annihilator', 'Jet Boost', 'Lola', '9036033503', null, null, null, null, null),  -- was row 31: Lola
  ('Darkl_', 'G¹', 'ACTIVE', 'BR', 'Anchor', 'iPhone 14pro', 'Low', true, true, 'M4', 'Other', 'Quick strike', 'SonOfGrace', '9066510845', null, null, null, null, null),  -- was row 32: Darkl_
  ('Male', 'G¹', 'ACTIVE', 'MP', 'Anchor', 'Samsung galaxy s22 plus', 'Average', false, true, 'Bal 27, agr 556, chopper, fss hurricane', 'Claw', 'Trap Master', '@bxki', '2348028965025', null, null, null, null, null),  -- was row 33: Male
  ('MUICHIRÓ', 'G¹', 'ACTIVE', 'MP', 'Objective', 'Google Pixel 6 pro', 'Average', false, false, 'Bal 27', 'Gravity Vortex Gun', 'Spotter', 'Sultan👑', '2347038439161', null, null, null, null, null);  -- was row 34: MUICHIRÓ

insert into public.applications
  (clan_tag, ign, status, whatsapp_name, whatsapp_number, activity, mode, mp_role,
   device, comps_experience, scrim_availability, weapons, mp_operator, br_class,
   submitted_at, roster_status)
values
  ('G¹', 'Lola', 'ACTIVE', 'Lola', '9036033503', 'Low', 'MP', 'slayer', 'ipad', false, true, 'type 12', 'Annihilator', 'Jet Boost', '2026-08-20T18:32:57.807Z', 'accepted'),
  ('G¹', 'Grandad', 'ACTIVE', 'Grandad', '2347013988325', 'High', 'Hybrid', 'Anchor', 'iPhone 15 Pro Max', true, true, 'AK117', 'Reactor Core', 'Trickster', '2026-08-20T20:05:12.588Z', 'accepted'),
  ('G¹', 'DeSaád', 'ACTIVE', 'Adeola', '353857859954', 'Average', 'BR', 'Slayer', 'M4', false, true, 'Type 19, bp50, 117 , ram , qq9, bizon 47 radiance, lag', 'K9-Unit', 'Pumped', '2026-08-20T20:06:12.449Z', 'pending'),
  ('G¹', 'Klaus', 'ACTIVE', 'Fela_Back👑', '2437017578870', 'Average', 'Hybrid', 'Slayer', 'iPad pro', true, true, 'By15, type-19', 'Other', 'Rewind', '2026-08-20T20:06:53.416Z', 'accepted'),
  ('G¹', 'ĐIÃMÔNÐ', 'ACTIVE', 'DIAMOND', '9133843539', 'Low', 'BR', null, 'iPhone 12', false, true, 'Ak117 , BY15', 'K9-Unit', 'Trap master', '2026-08-20T20:10:35.638Z', 'accepted'),
  ('G¹', 'Darkl_', 'ACTIVE', 'SonOfGrace', '9066510845', 'Low', 'BR', 'Anchor', 'iPhone 14pro', true, true, 'M4', 'Other', 'Quick strike', '2026-08-20T20:10:43.991Z', 'accepted'),
  ('G¹', 'Femoshe', 'ACTIVE', 'Femoshe', '8187413593', 'High', 'BR', 'Slayer', 'iPad 10th gen', true, true, 'Bal, fennec', 'Equalizer', 'Smoke bomber, trap master', '2026-08-20T20:11:11.161Z', 'accepted'),
  ('G¹', '25th', 'ACTIVE', 'ikigai', '2349022707940', 'Average', 'Hybrid', 'Objective', 'Samsung s22 plus', false, true, 'Hades, Hs, qq9, Ram7', 'Gravity Vortex Gun', 'Defender', '2026-08-20T20:11:55.380Z', 'accepted'),
  ('G¹', 'mide', 'ACTIVE', 'Justayomide', '7037174541', 'Average', 'BR', 'Slayer', 'I phone 15 pro', false, true, 'USS9 , Ak117', 'Gravity Vortex Gun', 'Ninja', '2026-08-20T20:14:22.934Z', 'accepted'),
  ('G¹', 'Shadow', 'ACTIVE', 'Shadow', '9010177269', 'Low', 'BR', 'Slayer', 'iPhone 11', true, true, 'Ak117', 'Shadow Blade', 'Ninja', '2026-08-20T20:16:16.452Z', 'accepted'),
  ('G¹', 'kinging', 'ACTIVE', 'kinging', '8057410728', 'Average', 'BR', 'Support', 'Samsung S24 Ultra', true, true, 'PP Bizon', 'K9-Unit', 'Medic', '2026-08-20T20:28:06.564Z', 'accepted'),
  ('G¹', 'Male', 'ACTIVE', '@bxki', '2348028965025', 'Average', 'MP', 'Anchor', 'Samsung galaxy s22 plus', false, true, 'Bal 27, agr 556, chopper, fss hurricane', 'Claw', 'Trap Master', '2026-08-20T20:34:41.655Z', 'accepted'),
  ('G¹', 'F31TXN', 'ACTIVE', 'bxki', '2348028965025', 'High', 'MP', 'Anchor', 'Samsung galaxy s22 plus', false, true, 'Bal 27, chopper, mg42, agr 556', 'Claw', 'Trap Master', '2026-08-20T20:53:26.117Z', 'accepted'),
  ('G¹', 'UNBROKEN', 'ACTIVE', 'G¹ | ÜÑẞRÖK£Ñ', '8083856873', 'Average', 'BR', 'SLAYER OBJ ANCHOR', 'RedmiA7', true, true, 'Ak117', 'Kinetic Armor', 'Ninja', '2026-08-20T21:34:19.731Z', 'accepted'),
  ('G¹', 'Reaper', 'ACTIVE', 'Mr Eddy', '8128963158', 'Average', 'BR', 'Slayer', 'iPhone 16', true, true, 'Uss9', 'Gravity Vortex Gun', 'Defender', '2026-08-21T01:18:39.529Z', 'accepted'),
  ('G¹', 'MUICHIRÓ', 'ACTIVE', 'Sultan👑', '2347038439161', 'Average', 'MP', 'Objective', 'Google Pixel 6 pro', false, false, 'Bal 27', 'Gravity Vortex Gun', 'Spotter', '2026-08-21T02:31:39.003Z', 'accepted'),
  ('G¹', 'Tinubu', 'ACTIVE', 'Big Ayo', '7035910741', 'Average', 'BR', 'Anchor', '16pro', true, true, 'Ak117 Krm', 'Sparrow', 'Ninja', '2026-08-21T14:19:40.378Z', 'accepted'),
  ('G¹', 'F8tal', 'ACTIVE', 'Capser', '8075596534', 'Low', 'BR', 'Objective', 'Samsung s10e', false, true, 'Bal, ots, AK 117, ram 7, by 15, krm', 'Purifier', 'Shockwave', '2026-08-21T18:26:31.790Z', 'pending');

update public.org_settings set manager_discord = '@geniocreativo';
