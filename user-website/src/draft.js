import { v4 as uuidv4 } from "uuid";

// The battery being built in the builder. Kept in App-level state (not in
// Home's own state) so it survives navigating to a task's settings page or
// to the libraries and back.
export const emptyDraft = () => ({
  // { battery_id, battery_index } of the battery this draft was copied from, or null.
  sourceBattery: null,
  header: {
    battery_index: "",
    battery_name: "The 3C Platform",
    description: "The 3C Platform",
    battery_instructions: "The 3C Platform",
    language: "EN",
    run_audio_test: true,
    footer: "©NCM Lab 2023",
    short_name: "",
    header_buttons: "", // comma-separated in the UI, JSON array in the database
    languages_to_show: "",
    redirect_url: "",
  },
  // [{ id, taskTypeId, name, parameterId, parameterName, instructionId, instructionName,
  //    instructionLanguage, iconName }] in run order
  items: [],
});

/** Turns an API_admin_get.php battery record into a builder draft for copy-on-edit. */
export function draftFromBattery(b) {
  return {
    sourceBattery: { battery_id: b.battery_id, battery_index: b.battery_index },
    header: {
      battery_index: "", // a copy always needs its own, unused index
      battery_name: b.battery_name ?? "",
      description: b.description ?? "",
      battery_instructions: b.battery_instructions ?? "",
      language: b.language,
      run_audio_test: b.run_audio_test,
      footer: b.footer ?? "",
      short_name: b.short_name ?? "",
      header_buttons: (b.header_buttons || []).join(", "),
      languages_to_show: (b.languages_to_show || []).join(", "),
      redirect_url: b.redirect_url ?? "",
    },
    items: b.tasks.map((t) => ({
      id: uuidv4(),
      taskTypeId: t.task_type_id,
      name: t.task_name,
      parameterId: t.parameter_id,
      parameterName: t.parameter_name,
      instructionId: t.instruction_id,
      instructionName: t.instruction_name,
      instructionLanguage: t.instruction_language,
      iconName: t.icon_name ?? "",
    })),
  };
}
