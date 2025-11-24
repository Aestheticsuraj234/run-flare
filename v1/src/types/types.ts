export interface CreateSubmissionBody {
  source_code: string;
  language_id: number;
  stdin?: string | null;
  expected_output?: string | null;
  user_id?: string | null;
  number_of_runs?: number;
  cpu_time_limit?: number;
  cpu_extra_time?: number;
  wall_time_limit?: number;
  memory_limit?: number;
  stack_limit?: number;
  max_processes_and_or_threads?: number;
  enable_per_process_and_thread_time_limit?: boolean;
  enable_per_process_and_thread_memory_limit?: boolean;
  max_file_size?: number;
  compiler_options?: string | null;
  command_line_arguments?: string | null;
  redirect_stderr_to_stdout?: boolean;
  callback_url?: string | null;
  additional_files?: string;  // base64 encoded string
  enable_network?: boolean;
  test_cases?: { stdin: string; expected_output?: string }[];
}

// WebSocket Message Types
export type WebSocketMessageType =
  | 'status_update'
  | 'progress_update'
  | 'error'
  | 'connected'
  | 'ping'
  | 'pong';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp: string;
  token: string;
}

export interface WebSocketStatusUpdate extends WebSocketMessage {
  type: 'status_update';
  status: {
    id: number;
    name: string;
    description: string;
  };
  data?: {
    stdout?: string;
    stderr?: string;
    time?: string;
    memory?: number;
    compile_output?: string;
    exit_code?: number;
    message?: string;
  };
}

export interface WebSocketProgressUpdate extends WebSocketMessage {
  type: 'progress_update';
  stage: 'compiling' | 'running' | 'evaluating';
  message: string;
}

export interface WebSocketErrorMessage extends WebSocketMessage {
  type: 'error';
  error: string;
  details?: string;
}

export interface WebSocketConnectedMessage extends WebSocketMessage {
  type: 'connected';
  message: string;
}
