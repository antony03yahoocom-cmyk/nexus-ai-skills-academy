// Your updated code content with the invalidateQueries calls goes here.

// Example of the modified onSuccess function:
// onSuccess: () => {
//     queryClient.invalidateQueries({ queryKey: ["all-completions"] });
//     queryClient.invalidateQueries({ queryKey: ["enrollments"] });
//     queryClient.invalidateQueries({ queryKey: ["course-completions"] });
// },