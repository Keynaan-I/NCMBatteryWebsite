import * as api from "../api";

// Parameter sets and instruction sets are handled by the same screens; this
// table holds everything that differs between the two.
export const KINDS = {
  parameter: {
    label: "parameter set",
    title: "Parameter sets",
    idKey: "parameter_id",
    nameKey: "parameter_name",
    bodyKey: "parameters",
    list: api.listParameters,
    create: (csrfToken, { taskTypeId, name, language, body }) =>
      api.createParameter(csrfToken, { taskTypeId, parameterName: name, language, parameters: body }),
    // task_parameters is unique on (task_type_id, parameter_name) -- language is not part of it.
    sameNameSpace: (row, taskTypeId) => row.task_type_id === taskTypeId,
  },
  instruction: {
    label: "instruction set",
    title: "Instruction sets",
    idKey: "instruction_id",
    nameKey: "instruction_name",
    bodyKey: "instructions",
    list: api.listInstructions,
    create: (csrfToken, { taskTypeId, name, language, body }) =>
      api.createInstruction(csrfToken, { taskTypeId, instructionName: name, language, instructions: body }),
    // task_instructions is unique on (task_type_id, instruction_name, language), so the same
    // name can exist once per language (that's how translations are stored).
    sameNameSpace: (row, taskTypeId, language) => row.task_type_id === taskTypeId && row.language === language,
  },
};
