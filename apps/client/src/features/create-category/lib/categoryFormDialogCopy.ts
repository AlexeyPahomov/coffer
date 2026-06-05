export function categoryFormDialogTitle(isEditing: boolean): string {
  return isEditing ? 'Редактировать категорию' : 'Новая категория'
}

export function categoryFormDialogDescription(isEditing: boolean): string {
  return isEditing
    ? 'Измените название, тип, перенос остатка или иконку категории.'
    : 'Укажите название, тип, перенос остатка и иконку новой категории.'
}
