from django.core.management.base import BaseCommand
from exercises.models import Exercise



EXERCISES_DATA = [
    # DBT - MINDFULNESS (10)
    {
        "title": "Observe Without Judgment",
        "category": "dbt",
        "therapy_type": "mindfulness",
        "content_format": "free_text",
        "nr_questions": 4,
        "content": (
            "Observe your inner and outer experience for 5 minutes without labeling anything as good or bad.\n\n"
            "Steps:\n"
            "1. Sit comfortably, close your eyes, set a timer for 5 minutes.\n"
            "2. Notice sounds, body sensations, thoughts, and feelings as they arise.\n"
            "3. Each time you judge something, gently return to just observing.\n"
            "4. When the timer ends, open your eyes and write below.\n\n"
            "Reflect:\n"
            "- What did you notice in your body?\n"
            "- What thoughts and emotions came up?\n"
            "- When was it hardest to stay non-judgmental?\n"
            "- What will you take away from this practice?"
        )
    },
    {
        "title": "Describe Your Experience in Facts",
        "category": "dbt",
        "therapy_type": "mindfulness",
        "content_format": "structured_reflection",
        "nr_questions": 3,
        "content": (
            "Practice describing experience using only concrete, observable language — no interpretations.\n\n"
            "Steps:\n"
            "1. Think of a recent emotional situation.\n"
            "2. Describe ONLY what happened using observable facts (what you saw, heard, felt physically).\n"
            "3. Now describe your internal experience: name the body sensations, the emotion, the urge.\n\n"
            "Reflect:\n"
            "- Which judgment words did you catch yourself using?\n"
            "- How did it feel to stick only to what is observable?\n"
            "- Write your factual description below."
        )
    },
    {
        "title": "Wise Mind Access",
        "category": "dbt",
        "therapy_type": "mindfulness",
        "content_format": "structured_reflection",
        "nr_questions": 4,
        "content": (
            "Access your Wise Mind — the integration of Emotion Mind and Reasonable Mind.\n\n"
            "Steps:\n"
            "1. Sit quietly, breathe slowly. Imagine descending to a calm center inside yourself.\n"
            "2. Think of a current problem or decision you are facing.\n"
            "3. Ask your Wise Mind: 'What do I know to be true about this situation?'\n"
            "4. Wait. Notice what comes up without forcing an answer.\n\n"
            "Reflect:\n"
            "- What answer or feeling arose from your Wise Mind?\n"
            "- Are you currently more in Emotion Mind or Reasonable Mind, and why?\n"
            "- What does your Wise Mind suggest you do next?\n"
            "- How confident do you feel in this answer?"
        )
    },
    {
        "title": "One-Mindfully: Single-Task Focus",
        "category": "dbt",
        "therapy_type": "mindfulness",
        "content_format": "free_text",
        "nr_questions": 3,
        "content": (
            "Do one thing at a time with complete awareness — no multitasking, no splitting attention.\n\n"
            "Steps:\n"
            "1. Choose a simple activity (washing dishes, drinking tea, walking).\n"
            "2. For 10 minutes, do ONLY that activity. When your mind wanders, bring it back.\n"
            "3. Notice every sensation, movement, and detail of the activity.\n\n"
            "Reflect:\n"
            "- How many times did your mind wander? Where did it go?\n"
            "- What did you notice about the activity that you usually miss?\n"
            "- How did doing one thing mindfully affect your stress level?"
        )
    },
    {
        "title": "Radical Acceptance Practice",
        "category": "dbt",
        "therapy_type": "mindfulness",
        "content_format": "free_text",
        "nr_questions": 4,
        "content": (
            "Radical Acceptance means accepting reality exactly as it is, without fighting it or approving of it.\n\n"
            "Steps:\n"
            "1. Identify a painful situation you have been resisting or fighting against.\n"
            "2. Observe the pain that comes from resisting vs. the pain of the situation itself.\n"
            "3. Say to yourself: 'This is what is. I accept that this is happening right now.'\n"
            "4. Practice accepting one small thing first, then expand.\n\n"
            "Reflect:\n"
            "- What situation are you struggling to accept?\n"
            "- What does fighting it cost you emotionally?\n"
            "- What would change if you fully accepted it (not approved, just accepted)?\n"
            "- Write what radical acceptance looks like for you in this situation."
        )
    },
    {
        "title": "Non-Judgmental Stance: Rewrite Your Thoughts",
        "category": "dbt",
        "therapy_type": "mindfulness",
        "content_format": "bullet_points",
        "nr_questions": 5,
        "content": (
            "Practice replacing judgmental language with factual, non-evaluative descriptions.\n\n"
            "Instructions:\n"
            "Write 5 judgmental thoughts or statements you said to yourself or others recently.\n"
            "For each one, rewrite it as a factual, non-judgmental observation.\n\n"
            "Format:\n"
            "Judgment: [your original judgmental thought]\n"
            "Fact: [the same situation described without judgment]\n\n"
            "Example:\n"
            "Judgment: 'I am such a failure.'\n"
            "Fact: 'I did not complete the task I planned. I felt disappointed.'\n\n"
            "Write your 5 pairs below."
        )
    },
    {
        "title": "Body Scan Awareness",
        "category": "dbt",
        "therapy_type": "mindfulness",
        "content_format": "structured_reflection",
        "nr_questions": 3,
        "content": (
            "Systematically move your attention through your body to build body awareness and reduce tension.\n\n"
            "Steps:\n"
            "1. Lie down or sit comfortably. Close your eyes.\n"
            "2. Start at the top of your head. Slowly move attention downward: forehead, jaw, neck, shoulders, chest, abdomen, arms, hands, legs, feet.\n"
            "3. At each area, just notice what is there — tension, warmth, tingling, numbness — without trying to change it.\n\n"
            "Reflect:\n"
            "- Where in your body did you notice the most tension or discomfort?\n"
            "- Were there areas that felt numb or that you had difficulty feeling at all?\n"
            "- How did your body feel at the start versus at the end of the scan?"
        )
    },
    {
        "title": "Mindful Breathing Log",
        "category": "dbt",
        "therapy_type": "mindfulness",
        "content_format": "free_text",
        "nr_questions": 3,
        "content": (
            "Focus your complete attention on the breath for 10 minutes. The breath is your anchor.\n\n"
            "Steps:\n"
            "1. Sit comfortably, set a timer for 10 minutes.\n"
            "2. Focus only on the physical sensations of breathing: the air entering your nose, your chest rising, air leaving.\n"
            "3. Each time a thought pulls you away, gently label it 'thinking' and return to the breath.\n\n"
            "Reflect:\n"
            "- How many times did your mind wander? What pulled it away most?\n"
            "- Did any emotions or physical sensations come up during the practice?\n"
            "- How does your state of mind feel now compared to before you started?"
        )
    },
    {
        "title": "Participate Fully in an Activity",
        "category": "dbt",
        "therapy_type": "mindfulness",
        "content_format": "free_text",
        "nr_questions": 3,
        "content": (
            "Participate fully means throwing yourself into an activity completely — no self-consciousness, no evaluation, just doing.\n\n"
            "Steps:\n"
            "1. Choose an activity you enjoy (dancing, cooking, drawing, playing music, sport).\n"
            "2. For at least 20 minutes, participate with your entire self. Let go of watching yourself.\n"
            "3. If you notice yourself stepping back and evaluating your performance, gently return to full participation.\n\n"
            "Reflect:\n"
            "- What activity did you choose and why?\n"
            "- How did it feel to let go of self-evaluation?\n"
            "- What was the difference between moments of full participation and moments of observing yourself?"
        )
    },
    {
        "title": "Describe Emotions Factually",
        "category": "dbt",
        "therapy_type": "mindfulness",
        "content_format": "structured_reflection",
        "nr_questions": 5,
        "content": (
            "Learn to describe emotions precisely using observable components, not interpretations.\n\n"
            "Instructions:\n"
            "Think of a strong emotion you felt recently. Describe it by filling in each component:\n\n"
            "1. Prompting Event: What happened just before the emotion? (facts only)\n"
            "2. Interpretations: What did you tell yourself about the event?\n"
            "3. Body Sensations: Where did you feel it in your body? Describe the sensations.\n"
            "4. Action Urge: What did you feel like doing?\n"
            "5. What you actually did: What was your behavior?\n\n"
            "Write your answers for each component below."
        )
    },

    # DBT - DISTRESS TOLERANCE (8)
    {
        "title": "TIPP: Physical Regulation",
        "category": "dbt",
        "therapy_type": "distress_tolerance",
        "content_format": "structured_reflection",
        "nr_questions": 4,
        "content": (
            "TIPP targets the body's physiology to quickly reduce extreme emotional arousal.\n\n"
            "TIPP stands for: Temperature, Intense exercise, Paced breathing, Progressive relaxation.\n\n"
            "Instructions:\n"
            "Choose one TIPP skill to practice right now or during your next crisis:\n"
            "- Temperature: Hold ice, splash cold water on your face, or hold a cold pack for 30 seconds.\n"
            "- Intense exercise: Do 20 jumping jacks or run in place for 1-2 minutes.\n"
            "- Paced breathing: Breathe in for 4 counts, out for 6 counts, for 5 minutes.\n"
            "- Progressive relaxation: Tense and release each muscle group from feet to head.\n\n"
            "Reflect:\n"
            "- Which skill did you try and how did it change your distress level (0-10, before and after)?\n"
            "- Which TIPP skill works best for you personally?\n"
            "- When could you use this skill in your daily life as prevention?"
        )
    },
    {
        "title": "ACCEPTS Distraction Plan",
        "category": "dbt",
        "therapy_type": "distress_tolerance",
        "content_format": "structured_reflection",
        "nr_questions": 7,
        "content": (
            "ACCEPTS helps you survive a crisis by distracting from emotional pain without making it worse.\n\n"
            "ACCEPTS: Activities, Contributing, Comparisons, Emotions (opposite), Pushing away, Thoughts (other), Sensations.\n\n"
            "Create YOUR personal ACCEPTS plan. For each letter, write 2 specific examples that work for you:\n\n"
            "A - Activities: (e.g., go for a walk, play a game)\n"
            "C - Contributing: (e.g., help a friend, volunteer)\n"
            "C - Comparisons: (e.g., think of harder times you survived)\n"
            "E - Emotions: (e.g., watch a funny video to feel something different)\n"
            "P - Push Away: (e.g., mentally put the problem in a box for now)\n"
            "T - Thoughts: (e.g., count backward from 100, do a puzzle)\n"
            "S - Sensations: (e.g., hold something cold, listen to loud music)"
        )
    },
    {
        "title": "Self-Soothe with 5 Senses",
        "category": "dbt",
        "therapy_type": "distress_tolerance",
        "content_format": "structured_reflection",
        "nr_questions": 5,
        "content": (
            "Self-soothing activates your parasympathetic nervous system through comforting sensory experiences.\n\n"
            "Plan your personal self-soothe kit for moments of distress. For each sense, write 2-3 specific comforting options:\n\n"
            "Vision: (e.g., look at photos of loved ones, watch a calming video)\n"
            "Hearing: (e.g., play a specific playlist, listen to rain sounds)\n"
            "Smell: (e.g., light a candle, smell a comforting scent)\n"
            "Taste: (e.g., make a warm drink, eat a favorite food slowly)\n"
            "Touch: (e.g., wrap in a soft blanket, hold a pet, take a warm shower)\n\n"
            "Write your personal options for each sense below. Be specific — vague plans don't work in a crisis."
        )
    },
    {
        "title": "Pros and Cons of Tolerating Distress",
        "category": "dbt",
        "therapy_type": "distress_tolerance",
        "content_format": "structured_reflection",
        "nr_questions": 4,
        "content": (
            "When distress is overwhelming, it helps to rationally examine the consequences of tolerating vs. acting impulsively.\n\n"
            "Think of a current painful situation where you have an urge to do something that might make things worse.\n\n"
            "Fill in the 4 quadrants:\n\n"
            "1. Pros of tolerating the distress (benefits of NOT acting on the urge)\n"
            "2. Cons of tolerating the distress (costs of NOT acting on the urge)\n"
            "3. Pros of NOT tolerating (benefits of acting on the urge)\n"
            "4. Cons of NOT tolerating (costs of acting on the urge)\n\n"
            "Review all 4 quadrants. Write your conclusion: what does tolerating look like in this situation, and is it worth it?"
        )
    },
    {
        "title": "STOP Skill Practice",
        "category": "dbt",
        "therapy_type": "distress_tolerance",
        "content_format": "structured_reflection",
        "nr_questions": 4,
        "content": (
            "STOP prevents impulsive reactions in a crisis by inserting a pause between urge and action.\n\n"
            "STOP: Stop, Take a step back, Observe, Proceed mindfully.\n\n"
            "Think of a recent situation where you reacted impulsively or wanted to.\n"
            "Apply STOP to that situation:\n\n"
            "S - Stop: What was the moment you needed to stop? What was the urge?\n"
            "T - Take a step back: How could you physically or mentally step back? (breathe, leave the room)\n"
            "O - Observe: What was happening around you and inside you at that moment?\n"
            "P - Proceed mindfully: What would the wise, skillful response have been?\n\n"
            "Write your answers for each step below."
        )
    },
    {
        "title": "Willingness vs. Willfulness",
        "category": "dbt",
        "therapy_type": "distress_tolerance",
        "content_format": "free_text",
        "nr_questions": 3,
        "content": (
            "Willingness means doing what is needed in the situation. Willfulness means refusing to do what works.\n\n"
            "Steps:\n"
            "1. Identify a current situation where you feel resistant, stuck, or like you just don't want to try.\n"
            "2. Ask yourself: Am I being willful here? Am I refusing to accept what is or to do what helps?\n"
            "3. Notice the signs of willfulness in your body (crossed arms, clenched jaw, shutting down).\n"
            "4. Practice shifting to willingness: open your hands, take a breath, say 'I am willing.'\n\n"
            "Reflect:\n"
            "- What situation are you being willful about?\n"
            "- What would being willing actually look like in this case?\n"
            "- What is one small step toward willingness you could take today?"
        )
    },
    {
        "title": "IMPROVE the Moment",
        "category": "dbt",
        "therapy_type": "distress_tolerance",
        "content_format": "structured_reflection",
        "nr_questions": 7,
        "content": (
            "IMPROVE helps you survive painful moments by changing how you experience them, not the events themselves.\n\n"
            "IMPROVE: Imagery, Meaning, Prayer, Relaxation, One thing, Vacation, Encouragement.\n\n"
            "For a current stressful situation, try at least 3 IMPROVE strategies:\n\n"
            "I - Imagery: Imagine a safe, peaceful place in detail. What do you see, hear, feel there?\n"
            "M - Meaning: Can you find any meaning, lesson, or purpose in this painful moment?\n"
            "P - Prayer or connection: What would you say to a higher power or your deepest values right now?\n"
            "R - Relaxation: What relaxation technique could you use right now?\n"
            "O - One thing: What is the ONE thing you need to focus on right now?\n"
            "V - Vacation: Plan a small mental vacation — a film, a walk, a coffee break.\n"
            "E - Encouragement: Write 3 encouraging statements to yourself about getting through this."
        )
    },
    {
        "title": "Half-Smile and Willing Hands",
        "category": "dbt",
        "therapy_type": "distress_tolerance",
        "content_format": "free_text",
        "nr_questions": 3,
        "content": (
            "Half-smile and willing hands send signals of acceptance to your brain through your body posture.\n\n"
            "Instructions:\n"
            "1. Sit comfortably. Think of a situation you are struggling to accept.\n"
            "2. Gently lift the corners of your mouth just slightly — a half-smile, relaxed, not forced.\n"
            "3. Turn your hands palms-up on your knees, fingers slightly open — willing hands.\n"
            "4. Hold this posture for 2-3 minutes while thinking of the difficult situation.\n\n"
            "Reflect:\n"
            "- Did the posture affect how you felt? Describe the shift, even if small.\n"
            "- How is this different from fake happiness or suppressing emotions?\n"
            "- When during your day could you practice this posture?"
        )
    },
    # DBT - EMOTION REGULATION (7)
    {
        "title": "Check the Facts",
        "category": "dbt",
        "therapy_type": "emotion_regulation",
        "content_format": "structured_reflection",
        "nr_questions": 5,
        "content": (
            "Emotions fit the facts when they match what is actually happening — not our interpretations of it.\n\n"
            "Think of a strong emotion you felt recently. Answer each question:\n\n"
            "1. What is the emotion and how intense is it (0-10)?\n"
            "2. What is the prompting event? (describe only the observable facts)\n"
            "3. What are your interpretations and assumptions about the event?\n"
            "4. What is the worst case that could realistically happen? How likely is it?\n"
            "5. Does your emotional response fit the FACTS, or does it fit your INTERPRETATIONS?\n\n"
            "If the emotion fits the facts -> use opposite action or problem solving.\n"
            "If not -> check the facts again, challenge the interpretation, and notice how the emotion shifts."
        )
    },
    {
        "title": "Opposite Action Plan",
        "category": "dbt",
        "therapy_type": "emotion_regulation",
        "content_format": "structured_reflection",
        "nr_questions": 4,
        "content": (
            "Opposite action changes emotions by acting opposite to the urge the emotion is creating.\n\n"
            "Steps:\n"
            "1. Name the emotion you want to change.\n"
            "2. Identify what the emotion urges you to do (e.g., fear -> avoid; shame -> hide; anger -> attack).\n"
            "3. Check: does this emotion fit the facts of the situation?\n"
            "4. If not, plan and commit to the OPPOSITE action ALL THE WAY. Half-measures don't work.\n\n"
            "Fill in:\n"
            "- Emotion and intensity (0-10):\n"
            "- Action urge:\n"
            "- Does it fit the facts? (yes/no and why):\n"
            "- Opposite action you will take (be specific and commit to doing it fully):"
        )
    },
    {
        "title": "PLEASE Skills Weekly Check",
        "category": "dbt",
        "therapy_type": "emotion_regulation",
        "content_format": "structured_reflection",
        "nr_questions": 5,
        "content": (
            "PLEASE targets the physical vulnerabilities that make you more emotionally reactive.\n\n"
            "PLEASE: Physical illness, Eating, Avoiding mood-altering substances, Sleep, Exercise.\n\n"
            "Rate each area this week (1=poor, 10=excellent) and describe what happened:\n\n"
            "P - Physical illness: Did you treat any illness or pain? Did you take prescribed medications?\n"
            "L - Eating: Did you eat balanced meals at regular times? Rate and describe.\n"
            "E - Avoiding substances: Did you avoid alcohol, caffeine, or drugs? Rate and describe.\n"
            "A - Sleep: Did you sleep 7-9 hours consistently? Rate and describe.\n"
            "S - Exercise: Did you get physical activity? Rate and describe.\n\n"
            "Write 1 concrete improvement for the lowest-rated area next week."
        )
    },
    {
        "title": "Accumulate Positive Experiences",
        "category": "dbt",
        "therapy_type": "emotion_regulation",
        "content_format": "bullet_points",
        "nr_questions": 4,
        "content": (
            "Building a life worth living requires actively adding positive experiences — they don't just happen.\n\n"
            "Short-term: Plan 3 pleasant activities for this week. Choose things that genuinely bring you enjoyment, not obligation.\n"
            "1.\n2.\n3.\n\n"
            "Long-term: Identify 1 value that matters to you (family, creativity, health, learning, connection).\n"
            "Write 1 concrete step toward a goal connected to that value that you can do this week.\n\n"
            "Mindfulness in positives: When you are in a positive moment, practice noticing it fully without letting worry pull you away.\n"
            "Describe a recent positive moment and how present you were in it.\n\n"
            "Be specific. Vague intentions (like 'spend more time outside') rarely happen. Write exact plans."
        )
    },
    {
        "title": "Build Mastery: Daily Accomplishment",
        "category": "dbt",
        "therapy_type": "emotion_regulation",
        "content_format": "bullet_points",
        "nr_questions": 5,
        "content": (
            "Mastery activities build self-efficacy and reduce emotional vulnerability.\n\n"
            "Plan one challenging-but-achievable activity for each of the next 5 days.\n"
            "The activity should stretch you slightly — not too easy (boring), not too hard (discouraging).\n\n"
            "Day 1:\nDay 2:\nDay 3:\nDay 4:\nDay 5:\n\n"
            "After completing each activity, rate your sense of accomplishment (0-10).\n\n"
            "Important: Choose activities that are a real challenge for YOU right now. What others find easy may still be a genuine stretch for you, and that's valid.\n\n"
            "After the 5 days, come back and write: Did completing these activities affect your overall mood or confidence?"
        )
    },
    {
        "title": "Identify Emotion Components",
        "category": "dbt",
        "therapy_type": "emotion_regulation",
        "content_format": "structured_reflection",
        "nr_questions": 6,
        "content": (
            "Understanding the full anatomy of an emotion helps you intervene at any point in the cycle.\n\n"
            "Choose a strong emotion from the past 48 hours. Break it down:\n\n"
            "1. Name the emotion (be specific — 'bad' is not an emotion).\n"
            "2. Prompting event: What external event triggered the emotion? (just facts)\n"
            "3. Vulnerability factors: Were you tired, hungry, or already stressed before this?\n"
            "4. Interpretations: What story did you tell yourself about the event?\n"
            "5. Body sensations: Where and how did you feel the emotion physically?\n"
            "6. Action urge and what you did: What did you want to do, and what did you actually do?\n\n"
            "Write your answers below."
        )
    },
    {
        "title": "Reduce Vulnerability: Personal Plan",
        "category": "dbt",
        "therapy_type": "emotion_regulation",
        "content_format": "structured_reflection",
        "nr_questions": 3,
        "content": (
            "Identify and reduce the factors that make you more emotionally vulnerable.\n\n"
            "Step 1: Identify your top 3 personal vulnerability factors.\n"
            "Common ones: poor sleep, skipping meals, social isolation, overcommitting, avoiding exercise, substance use, untreated pain.\n"
            "Your top 3:\n1.\n2.\n3.\n\n"
            "Step 2: For each vulnerability factor, write one specific, realistic change you could make this week.\n"
            "Change for factor 1:\nChange for factor 2:\nChange for factor 3:\n\n"
            "Step 3: What is the single most impactful change you could make? Write a commitment to that change."
        )
    },

    # DBT - INTERPERSONAL EFFECTIVENESS (5)
    {
        "title": "DEAR MAN Script",
        "category": "dbt",
        "therapy_type": "interpersonal_effectiveness",
        "content_format": "structured_reflection",
        "nr_questions": 7,
        "content": (
            "DEAR MAN helps you ask for what you need or say no while maintaining self-respect.\n\n"
            "Think of a difficult request or refusal you need to make. Write your DEAR MAN script:\n\n"
            "D - Describe the situation using only facts (no interpretations):\n"
            "E - Express how you feel using 'I' statements:\n"
            "A - Assert what you want clearly and directly:\n"
            "R - Reinforce: what positive outcome will this have for both of you?\n"
            "M - Mindful: how will you stay focused on your goal if they push back?\n"
            "A - Appear confident: how will you use your voice and body language?\n"
            "N - Negotiate: what are you willing to compromise on, if anything?\n\n"
            "Write the script as if you were going to say it out loud."
        )
    },
    {
        "title": "GIVE Skills Reflection",
        "category": "dbt",
        "therapy_type": "interpersonal_effectiveness",
        "content_format": "structured_reflection",
        "nr_questions": 4,
        "content": (
            "GIVE helps you maintain and improve relationships even in difficult conversations.\n\n"
            "GIVE: Gentle, Interested, Validate, Easy manner.\n\n"
            "Think of a recent interaction that felt difficult or went wrong.\n"
            "Reflect on how you used (or could have used) each GIVE skill:\n\n"
            "G - Gentle: Were you gentle, without attacks or threats? What would gentleness look like here?\n"
            "I - Interested: Did you listen and ask questions? What would showing genuine interest look like?\n"
            "V - Validate: Did you acknowledge the other person's feelings and perspective as understandable?\n"
            "E - Easy manner: Did you use humor or a light touch when appropriate?\n\n"
            "Write how you would replay this interaction using all four GIVE skills."
        )
    },
    {
        "title": "FAST: Self-Respect Check",
        "category": "dbt",
        "therapy_type": "interpersonal_effectiveness",
        "content_format": "structured_reflection",
        "nr_questions": 4,
        "content": (
            "FAST helps you maintain self-respect in relationships, especially when you tend to please others at your own expense.\n\n"
            "FAST: Fair, Apologies (avoid excessive), Stick to values, Truthful.\n\n"
            "Think of a recent interaction where you may have compromised your self-respect.\n\n"
            "F - Fair: Were you fair to both yourself AND the other person, or only to them?\n"
            "A - Avoid over-apologizing: Did you apologize for things that aren't your fault, or say sorry excessively?\n"
            "S - Stick to values: Did you act in line with your values, or did you go against them to please someone?\n"
            "T - Truthful: Were you honest, or did you exaggerate, minimize, or say what others wanted to hear?\n\n"
            "Write your reflection for each letter and what you would do differently."
        )
    },
    {
        "title": "Relationship Needs Inventory",
        "category": "dbt",
        "therapy_type": "interpersonal_effectiveness",
        "content_format": "bullet_points",
        "nr_questions": 5,
        "content": (
            "Knowing your needs in relationships is the first step to getting them met skillfully.\n\n"
            "Part 1: List your 5 most important needs in close relationships.\n"
            "Examples: feeling heard, physical affection, honesty, space, consistency, respect, support.\n"
            "1.\n2.\n3.\n4.\n5.\n\n"
            "Part 2: For each need, rate how well it is being met in your most important relationship right now (0-10).\n"
            "Need 1:\nNeed 2:\nNeed 3:\nNeed 4:\nNeed 5:\n\n"
            "Part 3: For the least-met need, write one specific thing you could ask for or do to address it this week."
        )
    },
    {
        "title": "Factors Affecting My Interpersonal Goals",
        "category": "dbt",
        "therapy_type": "interpersonal_effectiveness",
        "content_format": "structured_reflection",
        "nr_questions": 5,
        "content": (
            "Many factors affect whether your interpersonal skills work. Understanding them helps you plan better.\n\n"
            "Think of a current relationship challenge. Answer each question:\n\n"
            "1. What are your three goals in this relationship right now? (objective, relationship, self-respect)\n"
            "2. What skills and strengths do you bring to this situation?\n"
            "3. What factors are working against you? (past patterns, current emotions, the other person's behavior)\n"
            "4. How much do you currently want this outcome? How much are you willing to give?\n"
            "5. What is ONE thing you could do differently in your next interaction with this person?\n\n"
            "Write your answers below."
        )
    },

    # CBT - COGNITIVE RESTRUCTURING (8)
    {
        "title": "Triple Column Thought Record",
        "category": "cbt",
        "therapy_type": "cognitive_restructuring",
        "content_format": "structured_reflection",
        "nr_questions": 3,
        "content": (
            "The Triple Column Thought Record is the foundation of CBT. It teaches you to catch and challenge distorted thinking.\n"
            "Based on Beck's Cognitive Therapy model (1979).\n\n"
            "Choose a distressing event from this week. Fill in the three columns:\n\n"
            "1. AUTOMATIC THOUGHT\n"
            "What thought came to your mind automatically? Write it exactly as it appeared.\n"
            "How much did you believe it in that moment? (0-100%)\n\n"
            "2. COGNITIVE DISTORTION\n"
            "What type of distorted thinking pattern is this? (e.g., all-or-nothing, catastrophizing, mind reading, emotional reasoning)\n\n"
            "3. RATIONAL RESPONSE\n"
            "Write a more balanced, realistic thought. What would you say to a friend with this thought?\n"
            "How much do you believe the rational response? (0-100%)"
        )
    },
    {
        "title": "Cognitive Distortions Identifier",
        "category": "cbt",
        "therapy_type": "cognitive_restructuring",
        "content_format": "bullet_points",
        "nr_questions": 5,
        "content": (
            "Identifying distorted thinking patterns is the first step to changing them.\n\n"
            "Common cognitive distortions: All-or-Nothing Thinking, Catastrophizing, Mind Reading, Fortune Telling, "
            "Emotional Reasoning, Should Statements, Labeling, Personalization, Filtering (ignoring positives), Overgeneralization.\n\n"
            "Instructions:\n"
            "Write 5 negative thoughts you had this week. For each one:\n"
            "a) Write the thought exactly as it occurred.\n"
            "b) Identify which cognitive distortion it contains.\n"
            "c) Rate your distress from this thought (0-10).\n\n"
            "Thought 1:\nThought 2:\nThought 3:\nThought 4:\nThought 5:\n\n"
            "Which distortion appeared most often? What does that tell you about your thinking patterns?"
        )
    },
    {
        "title": "Evidence For and Against",
        "category": "cbt",
        "therapy_type": "cognitive_restructuring",
        "content_format": "structured_reflection",
        "nr_questions": 3,
        "content": (
            "Beliefs feel true. Evidence shows us what is actually true. This exercise separates the two.\n\n"
            "Step 1: Write a negative belief or hot thought you hold about yourself, others, or the future.\n"
            "How much do you believe it right now? (0-100%)\n\n"
            "Step 2: EVIDENCE THAT SUPPORTS the belief.\n"
            "List only real facts — not feelings, not interpretations. Write as many as you find.\n\n"
            "Step 3: EVIDENCE THAT CONTRADICTS the belief.\n"
            "List real facts that go against this belief. Be thorough — our minds tend to ignore disconfirming evidence.\n\n"
            "Review both sides. Write a more balanced statement that accounts for all the evidence.\n"
            "How much do you believe the original thought now? (0-100%)"
        )
    },
    {
        "title": "Downward Arrow: Finding Core Beliefs",
        "category": "cbt",
        "therapy_type": "cognitive_restructuring",
        "content_format": "structured_reflection",
        "nr_questions": 5,
        "content": (
            "The downward arrow reveals the core beliefs beneath your surface thoughts. "
            "Developed by Burns (1980) from Beck's CBT model.\n\n"
            "Start with a negative automatic thought. Then ask: 'If this were true, what would that mean to me?'\n"
            "Keep asking that question at each level until you reach a core belief.\n\n"
            "Automatic thought:\n"
            "-> If that were true, what would it mean? (Level 2)\n"
            "-> If that were true, what would it mean? (Level 3)\n"
            "-> If that were true, what would it mean? (Level 4)\n"
            "-> Core belief reached:\n\n"
            "Reflect: Is this core belief realistic and fair? When did you first start believing this?\n"
            "Write a more balanced alternative to the core belief."
        )
    },
    {
        "title": "Responsibility Pie Chart",
        "category": "cbt",
        "therapy_type": "cognitive_restructuring",
        "content_format": "free_text",
        "nr_questions": 3,
        "content": (
            "People with depression or guilt often take 100% responsibility for negative events. "
            "This exercise distributes responsibility more realistically.\n\n"
            "Step 1: Write a negative event for which you blame yourself entirely.\n"
            "How responsible do you feel? (0-100%)\n\n"
            "Step 2: List ALL factors and people that contributed to this outcome (weather, other people, circumstances, timing, your own actions).\n"
            "Assign a percentage to each factor so they all add up to 100%.\n"
            "Your own contribution: ____%\n\n"
            "Step 3: Reflect. Looking at the full picture:\n"
            "- Did your percentage of responsibility change from your initial estimate?\n"
            "- What does a fair distribution of responsibility look like?\n"
            "- What would you say to a friend who took all the blame for this?"
        )
    },
    {
        "title": "Behavioral Experiment Design",
        "category": "cbt",
        "therapy_type": "cognitive_restructuring",
        "content_format": "structured_reflection",
        "nr_questions": 5,
        "content": (
            "Behavioral experiments test whether your predictions are accurate. They are more powerful than rational arguments.\n\n"
            "Step 1: Write the negative belief or prediction you want to test.\n"
            "How much do you believe it? (0-100%)\n\n"
            "Step 2: Design the experiment.\n"
            "What specific action could you take that would give you real evidence about this belief?\n"
            "What exactly will you do, when, and where?\n\n"
            "Step 3: Write your predicted outcome BEFORE doing the experiment.\n\n"
            "Step 4 (complete after): What actually happened?\n\n"
            "Step 5: What does the result tell you about the belief?\n"
            "How much do you believe it now? (0-100%)"
        )
    },
    {
        "title": "Decatastrophizing",
        "category": "cbt",
        "therapy_type": "cognitive_restructuring",
        "content_format": "structured_reflection",
        "nr_questions": 4,
        "content": (
            "Catastrophizing means overestimating how terrible an outcome will be and underestimating your ability to cope.\n\n"
            "Think of something you are currently dreading or worrying about. Answer each question:\n\n"
            "1. WORST CASE: What is the absolute worst realistic outcome?\n"
            "How likely is this? (0-100%) How bad would it actually be? (0-10)\n\n"
            "2. BEST CASE: What is the most optimistic realistic outcome?\n\n"
            "3. MOST LIKELY: What will probably actually happen?\n\n"
            "4. COPING PLAN: If the worst case happened, how would you cope? What resources do you have?\n"
            "Have you survived difficult things before? What does that tell you?\n\n"
            "Write your full answers below."
        )
    },
    {
        "title": "Best, Worst, and Most Likely Outcomes",
        "category": "cbt",
        "therapy_type": "cognitive_restructuring",
        "content_format": "structured_reflection",
        "nr_questions": 3,
        "content": (
            "Anxious thinking tends to focus only on worst-case scenarios. This exercise broadens perspective.\n\n"
            "Think of a situation you are anxious or worried about.\n\n"
            "1. WORST CASE SCENARIO:\n"
            "Describe it in detail. How likely is it on a scale of 0-100%?\n"
            "If it happened, what would you do? How would you cope?\n\n"
            "2. BEST CASE SCENARIO:\n"
            "Describe it in detail. How likely is it?\n\n"
            "3. MOST REALISTIC OUTCOME:\n"
            "Based on past experience and actual evidence, what is most likely to happen?\n"
            "How does focusing on the realistic outcome change how you feel?\n\n"
            "Write your three scenarios below."
        )
    },

    # CBT - BEHAVIORAL ACTIVATION (4)
    {
        "title": "Weekly Activity Schedule",
        "category": "cbt",
        "therapy_type": "behavioral_activation",
        "content_format": "bullet_points",
        "nr_questions": 7,
        "content": (
            "Depression and low mood reduce activity. Reduced activity deepens low mood. "
            "Behavioral Activation breaks this cycle by scheduling meaningful activities.\n\n"
            "Plan at least one activity for each day of the coming week.\n"
            "Mix two types:\n"
            "- PLEASURE activities: things you enjoy or used to enjoy\n"
            "- ROUTINE/MASTERY activities: things that give a sense of accomplishment\n\n"
            "Be specific: write WHAT, WHEN (time), and WHERE.\n\n"
            "Monday:\nTuesday:\nWednesday:\nThursday:\nFriday:\nSaturday:\nSunday:\n\n"
            "After the week: which activity had the most positive impact on your mood?"
        )
    },
    {
        "title": "Mastery and Pleasure Ratings",
        "category": "cbt",
        "therapy_type": "behavioral_activation",
        "content_format": "structured_reflection",
        "nr_questions": 2,
        "content": (
            "Rating activities for mastery and pleasure helps you identify what genuinely improves your mood.\n\n"
            "Record 5 activities from today or yesterday. For each, rate:\n"
            "M (Mastery): How much of a sense of achievement or competence did you feel? (0-10)\n"
            "P (Pleasure): How much enjoyment or satisfaction did you feel? (0-10)\n\n"
            "Activity 1: | M: | P:\n"
            "Activity 2: | M: | P:\n"
            "Activity 3: | M: | P:\n"
            "Activity 4: | M: | P:\n"
            "Activity 5: | M: | P:\n\n"
            "Important: You may feel low mastery or pleasure because of depression — that doesn't mean the activity wasn't worthwhile. "
            "Behave opposite to your mood and the feeling often follows later.\n\n"
            "Which activity had the best combined M+P score? Plan to repeat it."
        )
    },
    {
        "title": "Avoided Activities Hierarchy",
        "category": "cbt",
        "therapy_type": "behavioral_activation",
        "content_format": "bullet_points",
        "nr_questions": 8,
        "content": (
            "Avoidance maintains depression. Gradually re-engaging with avoided activities rebuilds your life.\n\n"
            "Part 1: List 8 activities you have been avoiding (or stopped doing) since your mood declined.\n"
            "These could be social, physical, creative, work-related, or self-care activities.\n\n"
            "1.\n2.\n3.\n4.\n5.\n6.\n7.\n8.\n\n"
            "Part 2: Rank them from EASIEST to HARDEST to re-engage with (1=easiest, 8=hardest).\n\n"
            "Part 3: Start with activities 1-3 this week.\n"
            "What is one concrete first step you can take toward activity #1 today?"
        )
    },
    {
        "title": "Activity and Mood Log",
        "category": "cbt",
        "therapy_type": "behavioral_activation",
        "content_format": "structured_reflection",
        "nr_questions": 3,
        "content": (
            "Tracking the connection between what you do and how you feel reveals patterns you can use to improve your mood.\n\n"
            "For the next 3 days, log entries using this format:\n\n"
            "Time | Activity | Mood (0-10) | Notes (what influenced the mood?)\n\n"
            "Try to log 4-6 times per day. Be specific about activities — 'rested' is less useful than 'lay in bed scrolling phone'.\n\n"
            "After 3 days, answer:\n"
            "- Which activities consistently raised your mood?\n"
            "- Which activities lowered your mood or kept it flat?\n"
            "- What is ONE change you could make to your daily routine based on this data?\n\n"
            "Write your log and reflections below."
        )
    },

    # CBT - PROBLEM SOLVING (4)
    {
        "title": "Problem Definition",
        "category": "cbt",
        "therapy_type": "problem_solving",
        "content_format": "free_text",
        "nr_questions": 3,
        "content": (
            "A clearly defined problem is already half-solved. Vague problems produce vague solutions.\n\n"
            "Step 1: Write the problem you are currently facing.\n"
            "Be specific: Who is involved? What exactly is happening? When? Where?\n"
            "Avoid vague descriptions like 'everything is wrong' or 'I can't cope'.\n\n"
            "Step 2: Write the goals you want to achieve by solving this problem.\n"
            "Use specific, realistic, and measurable terms.\n"
            "Ask: 'How will I know when this problem is solved or improved?'\n\n"
            "Step 3: What are the obstacles standing between you and your goals?\n"
            "List all the barriers — internal (fear, skills, energy) and external (people, resources, time).\n\n"
            "Write your clear problem statement below."
        )
    },
    {
        "title": "Solution Brainstorming",
        "category": "cbt",
        "therapy_type": "problem_solving",
        "content_format": "bullet_points",
        "nr_questions": 8,
        "content": (
            "Effective brainstorming generates QUANTITY over quality. Rules: no judgment, no editing, write everything.\n\n"
            "Write your clearly defined problem at the top.\n\n"
            "Problem:\n\n"
            "Now brainstorm at least 8 possible solutions. Include wild, impractical, and unusual ideas — they often lead to good ones.\n"
            "Do NOT evaluate any solution yet. Just generate.\n\n"
            "1.\n2.\n3.\n4.\n5.\n6.\n7.\n8.\n\n"
            "After writing all 8, circle the 3 that seem most promising. You will evaluate them in the next exercise."
        )
    },
    {
        "title": "Solution Evaluation",
        "category": "cbt",
        "therapy_type": "problem_solving",
        "content_format": "structured_reflection",
        "nr_questions": 3,
        "content": (
            "Evaluate your top 3 solutions systematically before choosing one.\n\n"
            "For each solution, consider:\n"
            "- Pros: What are the benefits of this solution?\n"
            "- Cons: What are the costs or risks?\n"
            "- Likelihood of success: How realistic is this solution for you right now? (0-10)\n"
            "- Short-term vs. long-term: Does it help now, later, or both?\n\n"
            "Solution 1:\nPros:\nCons:\nLikelihood:\n\n"
            "Solution 2:\nPros:\nCons:\nLikelihood:\n\n"
            "Solution 3:\nPros:\nCons:\nLikelihood:\n\n"
            "Based on your evaluation, which solution will you implement? Why?\n"
            "Write your decision and your reasoning below."
        )
    },
    {
        "title": "Action Plan",
        "category": "cbt",
        "therapy_type": "problem_solving",
        "content_format": "structured_reflection",
        "nr_questions": 5,
        "content": (
            "A good decision without a concrete plan rarely becomes action. Write the plan before you lose momentum.\n\n"
            "Solution I am implementing:\n\n"
            "Step 1: What is the FIRST concrete action I will take? (be specific about what, when, where)\n"
            "Step 2: What is the SECOND action?\n"
            "Step 3: What is the THIRD action?\n\n"
            "Obstacles: What might get in the way of following this plan?\n\n"
            "Contingency: If obstacle occurs, I will do:\n\n"
            "Review date: When will I check in to see if the plan is working?\n\n"
            "Write your full action plan below."
        )
    },

    # CBT - SELF MONITORING (4)
    {
        "title": "Thought and Mood Diary",
        "category": "cbt",
        "therapy_type": "self_monitoring",
        "content_format": "structured_reflection",
        "nr_questions": 4,
        "content": (
            "Monitoring thoughts and moods helps you identify patterns and early warning signs.\n\n"
            "Record 3 significant situations from today. For each, fill in:\n\n"
            "Situation 1:\n"
            "- Event: What happened? (facts only)\n"
            "- Emotions: What did you feel? How intense? (0-10)\n"
            "- Thoughts: What went through your mind at that moment?\n"
            "- Behavior: What did you do?\n\n"
            "Situation 2: [same format]\n\n"
            "Situation 3: [same format]\n\n"
            "After all 3 entries, reflect:\n"
            "- Was there a theme in your thoughts today?\n"
            "- What triggered the strongest emotional response? Why do you think that is?\n\n"
            "Write your diary entries below."
        )
    },
    {
        "title": "Trigger Identification Log",
        "category": "cbt",
        "therapy_type": "self_monitoring",
        "content_format": "bullet_points",
        "nr_questions": 5,
        "content": (
            "Identifying your personal triggers helps you prepare for and manage emotional reactions.\n\n"
            "Over the next 3-5 days, log emotional triggers as they happen:\n\n"
            "Format:\n"
            "Trigger: [what happened]\n"
            "Emotion + intensity (0-10):\n"
            "Physical signs in body:\n"
            "Response (what you did):\n\n"
            "Log at least 5 trigger incidents:\n"
            "1.\n2.\n3.\n4.\n5.\n\n"
            "After logging 5, identify:\n"
            "- Are there patterns? (same people, places, times, themes?)\n"
            "- What is your most common trigger?\n"
            "- For your most common trigger, what could you do differently next time?"
        )
    },
    {
        "title": "Behavior Chain Analysis",
        "category": "cbt",
        "therapy_type": "self_monitoring",
        "content_format": "structured_reflection",
        "nr_questions": 6,
        "content": (
            "A behavior chain reveals the full sequence of events, thoughts, and feelings that led to a problem behavior. "
            "Understanding the chain is how you break it.\n\n"
            "Choose a recent problem behavior (argument, self-sabotage, avoidance, impulsive action).\n\n"
            "1. Vulnerability factors: What was your emotional and physical state beforehand?\n"
            "2. Prompting event: What was the first link in the chain that started it?\n"
            "3. Chain of thoughts, feelings, and actions: Map each step that followed.\n"
            "4. Problem behavior: What was the behavior itself?\n"
            "5. Consequences: What were the short-term and long-term consequences?\n"
            "6. Intervention points: At which steps in the chain could you have intervened?\n"
            "What skill could you use at each intervention point?\n\n"
            "Write your chain analysis below."
        )
    },
    {
        "title": "Sleep and Mood Correlation Tracker",
        "category": "cbt",
        "therapy_type": "self_monitoring",
        "content_format": "structured_reflection",
        "nr_questions": 2,
        "content": (
            "Sleep and mood are closely linked. Tracking both helps you see the impact of sleep on your emotional state.\n\n"
            "For 7 days, record each morning:\n\n"
            "Day | Bedtime | Wake time | Total hours | Sleep quality (1-10) | Morning mood (1-10) | Notes\n\n"
            "Day 1:\nDay 2:\nDay 3:\nDay 4:\nDay 5:\nDay 6:\nDay 7:\n\n"
            "After 7 days, reflect:\n"
            "- Is there a clear relationship between sleep quality/hours and morning mood?\n"
            "- What conditions (time, no screens, routine) led to your best sleep?\n"
            "- Based on this data, write one realistic sleep hygiene change you will commit to.\n\n"
            "Write your tracker and reflections below."
        )
    },

]

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        created_count = 0
        skipped_count = 0

        for exercise_data in EXERCISES_DATA:
            exists = Exercise.objects.filter(title=exercise_data["title"],is_predefined=True).exists()

            if exists:
                skipped_count += 1
                continue

            Exercise.objects.create(
                title=exercise_data["title"],
                category=exercise_data["category"],
                therapy_type=exercise_data["therapy_type"],
                content_format=exercise_data["content_format"],
                nr_questions=exercise_data["nr_questions"],
                content=exercise_data["content"],
                is_predefined=True,
                is_shared_by_therapist=False,
                created_by=None,
                assigned_to=None)
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created: {created_count}, Skipped (already exist): {skipped_count}"))