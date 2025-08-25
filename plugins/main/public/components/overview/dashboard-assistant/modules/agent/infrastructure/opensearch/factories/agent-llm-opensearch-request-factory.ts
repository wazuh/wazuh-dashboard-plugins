import { AgentLLMOpenSearchRequestDto } from '../dtos/agent-llm-opensearch-request-dto';

export class AgentLLMOpenSearchRequestFactory {
  private static get defaultParameters(): Record<string, any> {
    return {
      max_iteration: 5,
      stop_when_no_tool_found: true,
      disable_trace: false,
      tool_response_rewrite: false,
      include_output_in_agent_response: false,
      "prompt.prefix": "You are a senior SOC analyst for Wazuh.\n\nFIRST OUTPUT:\n- Output a single JSON object: {\"thought\": string, \"action\": \"alerts\"|\"vulns\", \"action_input\": string}.\n\nROUTING:\n- Wazuh alerts -> action \"alerts\". CVEs -> action \"vulns\".\n\nQUERY (OpenSearch query_string):\n- action_input is ONE query_string (no JSON). Join with AND. No quotes. No parentheses. No backslashes.\n- Time: if user gives a window, use exactly @timestamp:[now-<window> TO now]. If not, append AND @timestamp:[now-24h TO now]. Never send no-time queries unless user explicitly requests all-time.\n- If a value has ':' or spaces, prefer rule.id mappings below; if you must search rule.description, use INTERNAL wildcards between key tokens (e.g., rule.description:sshd*non-existent*user) and never leading/trailing '*'.\n\nSHORT MAPPINGS (only when text clearly matches):\n- \"Logon Failure - Unknown user or bad password\" -> rule.id:60122\n- sshd: Attempt to login using a non-existent user -> rule.id:5710\n- Deleted files -> rule.groups:syscheck_entry_deleted\n- \"failed login\" (generic) -> rule.groups:authentication_failed\n- \"rule ID <number>\" -> rule.id:<number>\n- CVE-XXXX-XXXX -> vulnerability.id:<ID> (use action \"vulns\")\n\nAFTER TOOL:\n- If hits > 0: respond directly to the end user in a concise, professional incident summary based only on the search results. Do not mention yourself, your role, the process, steps, or tools.\n- If zero hits OR any error: reply EXACTLY: \"No relevant alerts were found for the requested criteria.\""
    };
  }

  public static create(params: {
    model_id: string;
    response_filter: string;
    extra_parameters?: Record<string, any>;
  }): AgentLLMOpenSearchRequestDto {
    return {
      model_id: params.model_id,
      parameters: {
        response_filter: params.response_filter,
        ...this.defaultParameters,
        ...params.extra_parameters,
      },
    };
  }
}
