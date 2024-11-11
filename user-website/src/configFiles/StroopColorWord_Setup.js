var ResponseChoices = ['v','b','n','m',27]

// These are the buttons shown on the screeen which the user sees and uses.
// They are not color coded, they just have the words

var ColorTestQuestionTypes = 4
var WordTestQuestionTypes = 4
var ColorWordTestQuestionTypes = 16

export var StroopColorWord_Default = {
	ColorWordPracticeRepeats: 1, // number, min: 0, max: 100
	ColorWordTestRepeats: 1, // number, min: 0, max: 100
	ITI_Range: [250, 500, 750, 1000, 1250, 1500, 1750, 2000],// only used if ITI duration < 0
    // This ITI Range is a series of values, in milliseconds. Ideally, the user should be able
    // to type this in.
	ITI_Duration: -99, // number, min: -1, max: 10000, units are in milliseconds
	AllowedTime: -99, // number, min: -1, max: 600, units in seconds
	Score_NumberTrials: null, // number, min: 1, max: 400. I think this is redundent though!
	Score_ProcedureName: null, // Text
	ShowInstructions: true, // boolean
	InstructionsSpoken: false, // boolean
	ShowWelcome: true, // boolean
	ShowThankYou: true, // boolean
  }
