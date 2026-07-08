// Maps a task_types.icon_file value from the database (e.g. "assets/Icons/WordRecall.png",
// a path relative to the *NCMBattery* study-assets repo) to a locally-bundled icon in *this*
// app. The two repos are deployed separately (see DiscussionLog.md), so this app can't just
// point an <img> at that path -- it needs its own copy of each icon, imported like any other
// asset so webpack bundles it.
//
// Falls back to a generic icon for any task_type whose icon isn't (yet) copied into
// src/assets/Icons/ -- several task types added to the database recently (EQ5D, Image Copy,
// Reading/Listening Test, the Cancellation/Stroop variants) don't have one yet.
import MultiChoice from "./assets/Icons/MultiChoice.png";
import CardSort from "./assets/Icons/CardSort.png";
import ClockDrawing from "./assets/Icons/ClockDrawing.png";
import ConsentForm from "./assets/Icons/ConsentForm.png";
import DigitSpan from "./assets/Icons/DigitSpan.png";
import Fluency from "./assets/Icons/Fluency.png";
import Likert from "./assets/Icons/Likert.png";
import LineBisection from "./assets/Icons/LineBisection.png";
import Listening from "./assets/Icons/Listening.png";
import MatrixReasoning from "./assets/Icons/MatrixReasoning.png";
import PatternComparison from "./assets/Icons/PatternComparison.png";
import ReadingTest from "./assets/Icons/ReadingTest.png";
import Screening from "./assets/Icons/Screening.png";
import SerialSubtraction from "./assets/Icons/SerialSubtraction.png";
import SpatialDMS from "./assets/Icons/SpatialDMS.png";
import StroopColor from "./assets/Icons/StroopColor.png";
import StroopColorWord from "./assets/Icons/StroopColorWord.png";
import StroopWord from "./assets/Icons/StroopWord.png";
import TrailMaking from "./assets/Icons/TrailMaking.png";
import VerbalDMS from "./assets/Icons/VerbalDMS.png";
import WordRecall from "./assets/Icons/WordRecall.png";
import WordRecog from "./assets/Icons/WordRecog.png";
import YesNo from "./assets/Icons/YesNo.png";
import Cancellation from "./assets/Icons/Cancellation.png";

// Keyed by the icon's basename, e.g. "WordRecall.png" -- matches whatever
// task_types.icon_file ends in, regardless of the NCMBattery-side folder prefix.
const ICONS_BY_BASENAME = {
  "CardSort.png": CardSort,
  "ClockDrawing.png": ClockDrawing,
  "ConsentForm.png": ConsentForm,
  "DigitSpan.png": DigitSpan,
  "Fluency.png": Fluency,
  "Likert.png": Likert,
  "LineBisection.png": LineBisection,
  "Listening.png": Listening,
  "MatrixReasoning.png": MatrixReasoning,
  "PatternComparison.png": PatternComparison,
  "ReadingTest.png": ReadingTest,
  "Screening.png": Screening,
  "SerialSubtraction.png": SerialSubtraction,
  "SpatialDMS.png": SpatialDMS,
  "StroopColor.png": StroopColor,
  "StroopColorWord.png": StroopColorWord,
  "StroopWord.png": StroopWord,
  "TrailMaking.png": TrailMaking,
  "VerbalDMS.png": VerbalDMS,
  "WordRecall.png": WordRecall,
  "WordRecog.png": WordRecog,
  "YesNo.png": YesNo,
  "Cancellation.png": Cancellation,
};

export function iconForTaskType(iconFile) {
  if (!iconFile) return MultiChoice;
  const basename = iconFile.split("/").pop();
  return ICONS_BY_BASENAME[basename] || MultiChoice;
}
