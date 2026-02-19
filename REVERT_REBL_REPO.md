# Revertir el repositorio de ReblTech al último commit correcto

**Objetivo:** Que el repositorio de la empresa (rebl-tech/keycliq) quede con el último commit correcto y no muestre el commit que añadía configuración de Vercel.

- **Commit a eliminar como “último” en el repo:** `d8dfb97` (chore: add Vercel config and .env.example for deploy)
- **Commit que debe quedar como último:** `c43b6fd` (Reduced vertical spacing in scan-no-match__content...)

---

## Quién puede hacerlo

Solo alguien con **permiso de escritura** en el repositorio `https://github.com/rebl-tech/keycliq` puede ejecutar estos pasos (admin o mantenedor). Si ya no tienes acceso, envía este documento a alguien de ReblTech.

---

## Pasos (en un clone del repo de ReblTech)

Quien tenga acceso debe abrir una terminal en una carpeta donde tenga clonado **solo** el repo de rebl-tech (o clonar ese repo en una carpeta nueva) y ejecutar:

### 1. Clonar el repo de la empresa (solo si no lo tiene ya)

```bash
git clone https://github.com/rebl-tech/keycliq.git rebl-keycliq-fix
cd rebl-keycliq-fix
```

### 2. Ver en qué rama está el commit d8dfb97

Normalmente será `main` o `mobile-ux-nomatch-fit`. Comprobar:

```bash
git branch -a --contains d8dfb97
git log --oneline -3
```

### 3. Dejar esa rama en el commit correcto c43b6fd

Sustituir `NOMBRE_RAMA` por la rama que quiera revertir (por ejemplo `main` o `mobile-ux-nomatch-fit`):

```bash
git checkout NOMBRE_RAMA
git reset --hard c43b6fdba151c43aaff8388385a3722249625e55
```

### 4. Subir el cambio al repo de ReblTech (revertir el remoto)

**Cuidado:** esto reescribe la historia de esa rama en el remoto.

```bash
git push origin NOMBRE_RAMA --force
```

Después de esto, en GitHub (rebl-tech/keycliq) el último commit de esa rama será `c43b6fd` y ya no aparecerá `d8dfb97`.

---

## Si se hizo push a varias ramas

Si el commit `d8dfb97` se subió a más de una rama (por ejemplo `main` y `mobile-ux-nomatch-fit`), hay que repetir los pasos 3 y 4 para cada rama:

```bash
git checkout main
git reset --hard c43b6fdba151c43aaff8388385a3722249625e55
git push origin main --force

git checkout mobile-ux-nomatch-fit
git reset --hard c43b6fdba151c43aaff8388385a3722249625e55
git push origin mobile-ux-nomatch-fit --force
```

---

## Resumen

| Acción        | Comando / resultado                                      |
|---------------|-----------------------------------------------------------|
| Commit a quitar | `d8dfb97` (Vercel config)                                |
| Commit final  | `c43b6fdba151c43aaff8388385a3722249625e55`               |
| Dónde        | Repositorio **rebl-tech/keycliq** en GitHub              |
| Cómo         | `git reset --hard c43b6fd` en la rama afectada y `git push origin RAMA --force` |

Tu repositorio personal (HernanAlegresa/keycliq) no se modifica con estos pasos; esto solo afecta al repo de la empresa.
