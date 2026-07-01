-- Student data load: team assignments, room assignments, high school.
-- Source: STUDENT APP LOAD 2026 (1).xlsx

begin;

-- Add high_school column
alter table public.user_profiles
  add column if not exists high_school text;

-- Bulk update student team, room, and high school
update public.user_profiles as up
set
  team_key     = nullif(v.team_key, ''),
  room_number  = v.room_number,
  high_school  = nullif(v.high_school, '')
from (values
  ('sullaykoroma09@icloud.com', '9', 'G101-A', 'Trenton Central High School'),
  ('daizahn451@gmail.com', '9', 'G101-B', 'Keansburg High School'),
  ('christopherzheng420@gmail.com', '9', 'G102-A', 'Ridge High School'),
  ('lportelli05@gmail.com', '9', 'G102-B', 'Marine Academy of Science and Technology'),
  ('nathanpullen1119@icloud.com', '9', 'G103-A', 'Northern Burlington County Regional High School'),
  ('nickmonteleone2010@gmail.com', '10', 'G103-B', 'Northern Burlington County Regional High School'),
  ('drprice_08@yahoo.com', '7', 'G104-A', 'Paulsboro High School'),
  ('evansnateara89@gmail.com', '7', 'G104-B', 'Winslow Township High School'),
  ('redddavis92@gmail.com', '7', 'G105-A', 'Union High School'),
  ('noahalopez0802@gmail.com', '7', 'G105-B', 'South Amboy High School'),
  ('jaomjaom513@gmail.com', '6', 'G108', 'Toms River South High School'),
  ('elifyavas856@gmail.com', '1', 'G201-A', 'Cherry Hill High School East'),
  ('cornelia.rai101@gmail.com', '7', 'G201-B', 'Atlantic City High School'),
  ('jenesisdel1@gmail.com', '1', 'G202-A', 'Bodine High School'),
  ('black.blissful1@gmail.com', '1', 'G202-B', 'Parrish Community High School'),
  ('snguyen0345@gmail.com', '7', 'G203-A', 'Raritan High School'),
  ('lexihauck7@gmail.com', '7', 'G203-B', 'Burlington Township High School'),
  ('wh0smalia7@gmail.com', '1', 'G204-A', 'Perth Amboy High School'),
  ('anneliecem@gmail.com', '1', 'G204-B', 'Ocean City High School'),
  ('audaciousmh13@gmail.com', '7', 'G205-A', 'Cinnaminson High School'),
  ('makaylabellamy911@gmail.com', '7', 'G205-B', 'Trenton Central High School'),
  ('tashuu2903@gmail.com', '7', 'G207', 'Whippany Park High School'),
  ('yafreinypayano@gmail.com', '7', 'G208', 'College Achieve Central Charter High School'),
  ('gabrielle.bernn@gmail.com', '9', 'G301-A', 'Bergenfield High School'),
  ('chanelwang210@gmail.com', '9', 'G301-B', 'Moorestown High School'),
  ('angelaanguyenn123@gmail.com', '9', 'G302-A', 'Pennsauken High School'),
  ('gamblaind@gmail.com', '9', 'G302-B', 'Atlantic County Institute of Technology'),
  ('sheareremma49@gmail.com', '9', 'G303-A', 'Collingswood High School'),
  ('spragueharper5@gmail.com', '9', 'G303-B', 'Southern Regional High School'),
  ('destinycarrasquillo09@gmail.com', '10', 'G304-A', 'Pennsauken High School'),
  ('sasha.dambal@gmail.com', '10', 'G304-B', 'Westfield High School'),
  ('alabiayanah@gmail.com', '10', 'G305-A', 'Absegami High School'),
  ('l.greene0508@gmail.com', '10', 'G305-B', 'Burlington County Institute of Technology'),
  ('starrallen094@gmail.com', '10', 'G306-A', 'Scranton Preparatory School'),
  ('joletembonea@gmail.com', '10', 'G306-B', 'Riverside High School'),
  ('maeganng18@gmail.com', '6', 'H101-A', 'Montgomery High School'),
  ('leilarbrown10@gmail.com', '6', 'H101-B', 'Marine Academy of Science and Technology'),
  ('kaylawebb022@icloud.com', '6', 'H102-A', 'Acellus Academy'),
  ('fluffypenguin924@gmail.com', '5', 'H102-B', 'Monroe Township High School'),
  ('rubymagchar@gmail.com', '5', 'H103-A', 'Burlington Township High School'),
  ('sgh.horse9073@gmail.com', '5', 'H103-B', 'South Amboy High School'),
  ('bryanam3810@gmail.com', '6', 'H104-A', 'Ewing High School'),
  ('allyroseandoscar@gmail.com', '6', 'H104-B', 'Burlington Township High School'),
  ('linej0510@gmail.com', '5', 'H105-A', 'Egg Harbor Township High School'),
  ('jnahshon@gmail.com', '5', 'H105-B', 'Cherry Hill High School West'),
  ('stephanie310weng@gmail.com', '5', 'H106-A', 'Randolph High School'),
  ('rhiankirby11@gmail.com', '5', 'H106-B', 'Union High School'),
  ('marleelegin11@gmail.com', '1', 'H201-A', 'Riverside High School'),
  ('zoevgandolfo@gmail.com', '1', 'H201-B', 'High Technology High School'),
  ('bscardino2009@gmail.com', '1', 'H202-A', 'Trinity Hall'),
  ('caroline.sifert@gmail.com', '1', 'H202-B', 'Watchung Hills Regional High School'),
  ('zhclairezh@gmail.com', '8', 'H203-A', 'Ridge High School'),
  ('aalanarodriguez19@gmail.com', '8', 'H203-B', 'Collingswood High School'),
  ('lilytrautz@gmail.com', '8', 'H204-A', 'Haddon Township High School'),
  ('ionanandy@gmail.com', '8', 'H204-B', 'Academy for Allied Health Sciences- UCVTS'),
  ('arshiya.sood1617@gmail.com', '8', 'H205-A', 'Biotechnology High School'),
  ('lizabello122@gmail.com', '8', 'H205-B', 'Moorestown High School'),
  ('jocelynmhart@gmail.com', '10', 'H301-A', 'Cherry Hill High School East'),
  ('jojohill1101@gmail.com', '10', 'H301-B', 'Hackettstown High School'),
  ('omk152009@gmail.com', '7', 'H302-A', 'Gloucester County Institute of Technology'),
  ('gmichaelah4@gmail.com', '4', 'H302-B', 'Cumberland Regional High School'),
  ('alexag4159@gmail.com', '6', 'H303-A', 'South Amboy High School'),
  ('alexisduwa1219@gmail.com', '6', 'H303-B', 'Washington Township High School'),
  ('wlucy1638@gmail.com', '7', 'H304-A', 'Marine Academy of Science and Technology'),
  ('yeshasethu2008@gmail.com', '9', 'H304-B', 'Cherokee High School'),
  ('julissaramoscastro22@gmail.com', '5', 'H305-A', 'Morristown High School'),
  ('kelsiesantiago0@gmail.com', '5', 'H305-B', 'Paulsboro High School'),
  ('kovalchyknadija12@gmail.com', '2', 'I201-A', 'Linden High School'),
  ('tjalihal@gmail.com', '4', 'I201-B', 'West Windsor Plainsboro High School North'),
  ('cateerler@gmail.com', '2', 'I202-A', 'Donovan Catholic High School'),
  ('vasconcelosslila@gmail.com', '4', 'I202-B', 'Donovan Catholic High School'),
  ('blessingofori28@gmail.com', '2', 'I203-A', 'Hightstown High School'),
  ('noellemccand@gmail.com', '4', 'I203-B', 'Moorestown High School'),
  ('giananisseli9@gmail.com', '2', 'I204-A', 'Moorestown High School'),
  ('areeba.sahir@icloud.com', '2', 'I204-B', 'Triton Regional High School'),
  ('terryberrytb@icloud.com', '4', 'I205-A', 'Paul VI High School'),
  ('janellemariem@icloud.com', '4', 'I205-B', 'Toms River South High School'),
  ('k.tima0611@gmail.com', '4', 'I207', 'Union High School'),
  ('alejandramacias2709@gmail.com', '2', 'I208', 'Bogota Jr./Sr. Highschool'),
  ('chrisdcox22@gmail.com', '1', 'I301-A', 'Abraham Clark High School'),
  ('yogesh.j.gohel@lmco.com', '1', 'I301-B', 'Lenape High School'),
  ('asabnani001@gmail.com', '1', 'I302-A', 'Don Bosco Preparatory High School'),
  ('teooceanmaster@gmail.com', '1', 'I302-B', 'Marine Academy of Science and Technology'),
  ('adataiyer@gmail.com', '1', 'I303-A', 'The Academy for Math, Science, and Engineering'),
  ('pranav.pillarisetty@gmail.com', '3', 'I303-B', 'Morris County School of Technology'),
  ('ethanmp986@gmail.com', '3', 'I304-A', 'Jackson Township High School'),
  ('njchiaravallo@gmail.com', '3', 'I304-B', 'Marine Academy of Technology and Environmental Science'),
  ('dajawnpatterson69@gmail.com', '8', 'I305-A', 'Trenton Central High School'),
  ('maatthewackerman@gmail.com', '8', 'I305-B', 'Burlington Township High School'),
  ('kingjames.escalona31@gmail.com', '10', 'I307', 'Lakewood High School'),
  ('kimaya02.singh@gmail.com', '2', 'J201-A', 'Watchung Hills Regional High School'),
  ('alexisroseman97@gmail.com', '2', 'J201-B', 'Cherry Hill High School East'),
  ('carinayushinglu@gmail.com', '2', 'J202-A', 'Morris County School of Technology'),
  ('alejandradelsalto0@gmail.com', '8', 'J202-B', 'North Plainfield High School'),
  ('wyndow20@gmail.com', '8', 'J203-A', 'Tenafly High School'),
  ('micahdavisvlogs8@gmail.com', '8', 'J203-B', 'Stuart Country Day School of the Sacred Heart'),
  ('mathischopstix@gmail.com', '6', 'J204-A', 'Keansburg High School'),
  ('chinonye970@gmail.com', '6', 'J204-B', 'Union High School'),
  ('maryamyasir444@gmail.com', '9', 'J205-A', 'Washington Township High School'),
  ('gialesher10@gmail.com', '10', 'J205-B', 'Washington Township High School'),
  ('jennaamer@icloud.com', '2', 'J206-A', 'Toms River East High School'),
  ('yas.abdelaal1@gmail.com', '3', 'J206-B', 'Toms River North High School'),
  ('srinikap100@gmail.com', '3', 'J301-A', 'Parsippany Hills High School'),
  ('ariana.williams0527@gmail.com', '3', 'J301-B', 'Scholars'' Academy'),
  ('gsochanchak34@students.bhprsd.org', '3', 'J302-A', 'Triton Regional High School'),
  ('sisira.guthikonda@gmail.com', '3', 'J302-B', 'West Windsor Plainsboro High School North'),
  ('tannerlajoie@icloud.com', '3', 'J303-A', 'Haddon Township High School'),
  ('chelseyreserve@gmail.com', '3', 'J303-B', 'Linden High School'),
  ('ashlyashby@outlook.com', '3', 'J304-A', 'Rahway High School'),
  ('bellamontes16777@gmail.com', '3', 'J304-B', 'Burlington County Institute of Technology'),
  ('kaur.mannatpahuja@gmail.com', '4', 'J305-A', 'Eastern Regional High School'),
  ('cgbbme4you@gmail.com', '4', 'J305-B', 'Monroe Township High School'),
  ('herman.vl@icloud.com', '3', 'J307', 'Cherry Hill High School East'),
  ('youngalanna25@gmail.com', '7', 'J310', 'Keansburg High School'),
  ('dorlyjean2010@gmail.com', '2', 'K201-A', 'Abraham Clark High School'),
  ('pappasquinn@gmail.com', '2', 'K201-B', 'Marine Academy of Science and Technology'),
  ('ipalma1209@gmail.com', '2', 'K202-A', 'Perth Amboy High School'),
  ('zacharyplum10@gmail.com', '2', 'K202-B', 'Riverside High School'),
  ('trevorbonneau@gmail.com', '4', 'K203-A', 'Jackson Township High School'),
  ('personaluse.andrewliu@gmail.com', '4', 'K203-B', 'Cherry Hill High School East'),
  ('jasonafum123@gmail.com', '4', 'K204-A', 'Rahway High School'),
  ('dudleyvolcy416@gmail.com', '4', 'K204-B', 'Trenton Central High School'),
  ('ciaran.haughian@gmail.com', '8', 'K205-A', 'Keansburg High School'),
  ('dunigandolan@gmail.com', '8', 'K205-B', 'Marine Academy of Science and Technology'),
  ('kaynicoletaylor@gmail.com', '8', 'K206-A', 'Paulsboro High School'),
  ('emrepadilla@gmail.com', '5', 'K301-A', 'Toms River South High School'),
  ('ranadiveneel@gmail.com', '10', 'K301-B', 'Morris County School of Technology'),
  ('prabhatankem@gmail.com', '5', 'K302-A', 'John P. Stevens High School'),
  ('rugvedhroyal@gmail.com', '5', 'K302-B', 'Montgomery High School'),
  ('bryanyih0728@gmail.com', '5', 'K303-A', 'Absegami High School'),
  ('jamelabdulkarim@gmail.com', '5', 'K303-B', 'Mainland Regional High School'),
  ('jw101410@gmail.com', '6', 'K304-A', 'Randolph High School'),
  ('rjrcaragan@gmail.com', '6', 'K304-B', 'Morristown High School'),
  ('graysenlane246@gmail.com', '6', 'K305-A', 'Paulsboro High School'),
  ('josephsealesjr@yahoo.com', '6', 'K305-B', 'Nashvile School of the Arts'),
  ('noahaksahin09@gmail.com', '10', 'K306-A', 'Lyndhurst High School'),
  ('lukefranco109@gmail.com', '10', 'K306-B', 'Marine Academy of Science and Technology')
) as v(email, team_key, room_number, high_school)
where up.email = v.email
  and up.program_year = 2026
  and up.role = 'student';

-- Drop and recreate get_directory_profiles with high_school column
drop function if exists public.get_directory_profiles(int);

create or replace function public.get_directory_profiles(year_param int)
returns table (
  id            uuid,
  full_name     text,
  email         text,
  role          text,
  team_key      text,
  guild_id      uuid,
  guild_name    text,
  guild_slug    text,
  room_number   text,
  social_handle text,
  phone_number  text,
  pronouns      text,
  specialty_tag text,
  cotl_color    text,
  superpower    text,
  high_school   text
)
security definer
set search_path = public, private
language sql as $$
  select
    up.id,
    up.full_name,
    null::text as email,
    up.role,
    up.team_key,
    up.guild_id,
    g.name  as guild_name,
    g.slug  as guild_slug,
    up.room_number,
    case
      when private.app_user_role() in ('staff', 'admin') and up.show_social
      then up.social_handle
      else null
    end as social_handle,
    null::text as phone_number,
    up.pronouns,
    up.specialty_tag,
    up.cotl_color,
    up.superpower,
    up.high_school
  from public.user_profiles up
  left join public.guilds g on g.id = up.guild_id
  where up.program_year = year_param
    and up.is_active = true
    and up.show_in_directory = true
    and private.app_user_year() = year_param
    and private.app_user_role() in ('student', 'staff', 'admin');
$$;

revoke all on function public.get_directory_profiles(int) from public, anon;
grant execute on function public.get_directory_profiles(int) to authenticated;

commit;
