import { useState, type SubmitEvent } from "react";

interface UserCreateFormProps {
  onCreate: (name: string, age: number) => void;
}

export function UserCreateForm({ onCreate }: UserCreateFormProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const parsedAge = Number(age);
    if (!name.trim() || !parsedAge || parsedAge <= 0) return;
    onCreate(name.trim(), parsedAge);
    setName("");
    setAge("");
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-wrap items-end gap-3'>
      <div className='flex flex-col gap-1'>
        <label className='text-xs text-slate-400'>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Jane Doe'
          className='rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <label className='text-xs text-slate-400'>Age</label>
        <input
          type='number'
          min={1}
          max={120}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder='28'
          className='w-24 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none'
        />
      </div>
      <button
        type='submit'
        className='rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400'
      >
        Create user
      </button>
    </form>
  );
}
